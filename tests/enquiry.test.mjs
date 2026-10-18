import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedLevels,validateEnquiry} from '../dist/content.js';
const valid={name:'Test Student',email:'student@example.com',phone:'+251 900 000 000',format:'online',level:'beginner',consent:'on'};
test('online enrolment cannot select intermediate or professional',()=>{assert.deepEqual(allowedLevels('online'),['beginner']);for(const level of ['intermediate','professional'])assert.ok(validateEnquiry({...valid,level}));});
test('in person accepts all three confirmed levels',()=>{for(const level of ['beginner','intermediate','professional'])assert.equal(validateEnquiry({...valid,format:'in-person',level}),'');});
test('rejects missing consent, malformed contact details and unknown format',()=>{for(const patch of [{consent:''},{email:'bad'},{phone:'0900000000'},{format:'unsupported'},{name:'   '}])assert.ok(validateEnquiry({...valid,...patch}));});
test('accepts a complete beginner enquiry',()=>assert.equal(validateEnquiry(valid),''));
