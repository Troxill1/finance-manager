import mongoose from "mongoose";

export const toDecimal128 = (property) => {
    return mongoose.Types.Decimal128.fromString(property.toString());
};

// for use in models
const Decimal128ToString = (obj) => {
    if (obj && typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
            const val = obj[key];

            if (val && typeof val === 'object' && val._bsontype === 'Decimal128') {
                obj[key] = val.toString();
            }
            // for nested schemas, objects, arrays
            else if (val && typeof val === 'object') {
                Decimal128ToString(val);
            }
        }
    }

    return obj;
}

export default Decimal128ToString;
