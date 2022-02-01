/**
 * FIXME: Argument should be declared as string but not allowed by TypeScript compiler.
 * May be a bug when comparing to 0x7f below.
 */
export function toStringLiteralJS(value: string): string {
    // single is preferred
    let quote = "'";
    if (value.indexOf("'") !== -1 && value.indexOf('"') === -1) {
        quote = '"';
    }
    const len = value.length;
    let ret = quote;
    for (let i = 0; i < len; ++i) {
        const c = value.charAt(i);
        if (c === quote || c === '\\')
            ret += '\\' + c;
        else if (c === '\t')
            ret += '\\t';
        else if (c === '\n')
            ret += '\\n';
        else if (c === '\r')
            ret += '\\r';
        else if (c < ' ' || c as unknown >= 0x7f) {
            let ashex = c.charCodeAt(0).toString(16);
            if (ashex.length < 2) ashex = "0" + ashex;
            ret += "\\x" + ashex;
        }
        else
            ret += c;
    }
    ret += quote;
    return ret;
}
