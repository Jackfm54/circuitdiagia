import { test } from "node:test";
import assert from "node:assert/strict";
import { bearerToken, owns } from "../server/access";
test("user records are private to their owner",()=>{assert.equal(owns("user-a","user-a"),true);assert.equal(owns("user-b","user-a"),false);assert.equal(owns(undefined,"user-a"),false);});
test("anonymous requests cannot supply an empty bearer",()=>{assert.equal(bearerToken(undefined),null);assert.equal(bearerToken("Bearer undefined"),null);assert.equal(bearerToken("Bearer "),null);assert.equal(bearerToken("Bearer example-session"),"example-session");});
