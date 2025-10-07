import mongoose from "mongoose";

export const toDecimal128 = (property) => {
    return mongoose.Types.Decimal128.fromString(property.toString());
};

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
};

// for use in models
const transformDoc = (schema) => {
    // Used when returning an object to the front-end (for display)
    schema.set("toJSON", {
        transform: (doc, ret) => Decimal128ToString(ret)
    });

    // Used when returning an object to the back-end (for arithmetic)
    schema.set("toObject", {
        transform: (doc, ret) => Decimal128ToString(ret)
    });
};

export default transformDoc;
