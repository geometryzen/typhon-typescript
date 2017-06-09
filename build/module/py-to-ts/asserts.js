/**
 * We're looking for something that is truthy, not just true.
 */
/**
 * We're looking for something that is truthy, not just true.
 */ export function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
export function fail(message) {
    assert(false, message);
}
