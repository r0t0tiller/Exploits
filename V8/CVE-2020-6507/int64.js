/* 
 * An Int64 implmentation with minimal allocations
 *
 */

var Binary = (function() {
    let memory = new ArrayBuffer(8);
    let view_u8 = new Uint8Array(memory);
    let view_u32 = new Uint32Array(memory);
    let view_f64 = new Float64Array(memory);

    return {
        view_u8: view_u8,
        view_u32: view_u32,
        view_f64: view_f64,

        i64_to_f64: (i64) => {
            view_u32[0] = i64.low;
            view_u32[1] = i64.high;
            return view_f64[0];
        },
        f64_to_i64: (f) => {
            view_f64[0] = f;
            return new Int64(undefined, view_u32[1], view_u32[0]);
        },
        i32_to_u32: (i32) => {
            // needed because 0xffffffff -> -1 as an int
            view_u32[0] = i32;
            return view_u32[0];
        },
        is_32: (v) => {
            return (v >= -0x80000000 && v < 0x100000000)
        },
        i64_from_buffer: (buff) => {
            let conv_buff;
            if (buff.BYTES_PER_ELEMENT === 1)
                conv_buff = view_u8;
            else if (buff.BYTES_PER_ELEMENT === 4)
                conv_buff = view_u32;
            else if (buff.BYTES_PER_ELEMENT === 8)
                conv_buff = view_f64;
            // Copy bytes
            for (let i=0; i<8/buff.BYTES_PER_ELEMENT; i++) {
                conv_buff[i] = buff[i];
            }
            return new Int64(undefined, view_u32[1], view_u32[0]);
        },
        store_i64_in_buffer: (i64, buff, offset=0) => {
            view_u32[0] = i64.low;
            view_u32[1] = i64.high;

            if (buff.BYTES_PER_ELEMENT === 1)
                buff.set(view_u8, offset);
            else if (buff.BYTES_PER_ELEMENT === 4)
                buff.set(view_u32, offset);
            else if (buff.BYTES_PER_ELEMENT === 8)
                buff.set(view_f64, offset);
        }
    }
})();

class Int64 {
    constructor(v, high, low) {
        if (high !== undefined && low !== undefined) {
            this.high = high;
            this.low = low;
        } else if (v instanceof Int64) {
            this.high = v.high;
            this.low = v.low;
        } else {
            let inst = this;
            return Int64._parse_arg(v, (h, l)=>{
                inst.high = h, inst.low = l;
            });
        }
    }
    toString() {
    	// Return as hex string
    	return '0x'+Binary.i32_to_u32(this.high)
    		.toString(16).padStart(8,'0') +
    	Binary.i32_to_u32(this.low)
    		.toString(16).padStart(8,'0');
    }
    _add_inplace(high, low) {
        let tmp = Binary.i32_to_u32(this.low) + Binary.i32_to_u32(low);
        this.low = tmp & 0xffffffff;
        let carry = (tmp > 0xffffffff)|0;
        this.high = (this.high + high + carry) & 0xffffffff;
        return this;
    }
    add_inplace(v) {
        if (v instanceof Int64)
            return this._add_inplace(v.high, v.low);

        return Int64._parse_arg(v, (h, l) => {
            return this._add_inplace(h, l);
        });
    }
    add(v) { return Int64.add(this, v); }

    
    _sub_inplace(high, low) {
        // Add with two's compliment
        this._add_inplace(~high, ~low)._add_inplace(0, 1);
        return this
    }
    sub_inplace(v) {
        if (v instanceof Int64)
            return this._sub_inplace(v.high, v.low);

        return Int64._parse_arg(v, (h, l) => {
            return this._sub_inplace(h, l);
        });
    }
    sub(v) { return Int64.sub(this, v); }

    to_double() { return Binary.i64_to_f64(this); }
    as_double() { return this.to_double(); }

    set_value(v) {
        if (v instanceof Int64) {
            this.high = v.high;
            this.low = v.low;
            return this;
        }
        return Int64._parse_arg(v, (h, l) => {
            this.high = h;
            this.low = l;
            return this;
        });
    }

    V8_from_SMI() { return Int64.V8_from_SMI(this); }
    V8_to_SMI() { return Int64.V8_to_SMI(this); }
    V8_untag() { return Int64.V8_untag(this); }
    V8_tag() { return Int64.V8_tag(this); }
    JSC_as_JSValue() { return Int64.JSC_as_JSValue(this); }

}

// Wrap an operation to try and decode the input value
// `v` can be a Int64, Number, Array, Int8Array
Int64._parse_arg = (v, callback) => {
    if (v instanceof Int64)
        return callback(v.high, v.low);

    if (typeof(v) === 'number') {
        if (v < -0x80000000 || v > 0xffffffff)
            return callback(
                Math.floor(v/0x100000000)|0, v|0);
        if (v < 0) // Sign extend
            return callback(-1, v|0);
        return callback(0, v|0);
    }

    if (typeof(v) === 'string') {
        if (v.startsWith('0x')) {
            v = v.slice(2);
            if (v.length > 16)
                throw("Hex string too long: "+v);
            if (v.length <= 8)
                return callback(0, parseInt(v, 16));
            return callback(
                parseInt(v.slice(0,-8), 16),
                parseInt(v.slice(-8), 16));
        }
    }

    if (v instanceof Array || v instanceof Int8Array) {
        Binary.view_u8.set(v);
        return callback(Binary.view_u32[1], Binary.view_u32[0]);
    }

    throw ("Don't know how to convert to Int64: "+v);
}

// If v is not an Int64, create one
Int64.to_Int64 = (v) => {
    if (v instanceof Int64)
        return v;
    return new Int64(v);
}

Int64.from_double = (d) => {
    return Binary.f64_to_i64(d);
}

Int64.to_double = (v) => {
    v = Int64.to_Int64(v);
    return Binary.i64_to_f64(v);
}

Int64.add = (a,b) => {
    let res = new Int64(a);

    if (b instanceof Int64)
        return res._add_inplace(b.high, b.low);

    return Int64._parse_arg(b, (h, l) => {
        return res._add_inplace(h, l);
    });
}

Int64.sub = (a,b) => {
    let res = new Int64(a);

    if (b instanceof Int64)
        return res._sub_inplace(b.high, b.low);

    return Int64._parse_arg(b, (h, l) => {
        return res._sub_inplace(h, l);
    });
}

// Return an integer encoded as a V8 SMI
// 0x4142434 -> 0x4142434400000000
Int64.V8_to_SMI = (a) => {
    if (a.high !== 0)
        throw("Cannot make into SMI: " + a.toString());
    return new Int64(undefined, a.low, 0);
}

// Return an encoded V8 SMI as an integer
// 0x4142434400000000 -> 0x4142434 
Int64.V8_from_SMI = (a) => {
    if (a.low !== 0)
        throw("Not encoded as an SMI: " + a.toString());
    return new Int64(undefined, 0, a.high);
}

Int64.V8_tag = (a) => {
    return new Int64(undefined, a.high, a.low|1);
}

Int64.V8_untag = (a) => {
    return new Int64(undefined, a.high, a.low&0xfffffffe);
}

// Return a NaNboxed JSValue
// This only makes sense for JavaScriptCore!
Int64.JSC_as_JSValue = (a) => {
    a = Int64.to_Int64(a);
    let high = Binary.i32_to_u32(a.high);
    if (high < 0x10000 || high >= 0xffff0000)
        throw(a.toString()+" cannot be encoded as JSValue");

    a._sub_inplace(0x20000, 0);
    let res = Binary.i64_to_f64(a);
    a._add_inplace(0x20000, 0);
    return res;
}
