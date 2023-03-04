export function validType(val, fieldType) {
    return (fieldType === "numeric" && typeof val === "number") ||
           (fieldType === "Date" && val !== null);
}