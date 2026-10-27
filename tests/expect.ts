import assert from "node:assert/strict";
export { describe,test } from "node:test";
export function expect(value: any) { return {
 toEqual: (other: any) => assert.deepEqual(value,other),
 toBe: (other: any) => assert.equal(value,other),
 toBeUndefined: () => assert.equal(value,undefined),
 toHaveLength: (size: number) => assert.equal(value.length,size),
 toContain: (part: string) => assert.ok(value.includes(part)),
 toStartWith: (part: string) => assert.ok(value.startsWith(part)),
 toBeCloseTo: (other: number) => assert.ok(Math.abs(value-other)<0.005),
 toThrow: () => assert.throws(value),
}; }
