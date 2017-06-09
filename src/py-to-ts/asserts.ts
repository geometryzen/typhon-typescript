/**
 * We're looking for something that is truthy, not just true.
 */
export function assert(condition: any, message?: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

export function fail(message: string): void {
    assert(false, message);
}
