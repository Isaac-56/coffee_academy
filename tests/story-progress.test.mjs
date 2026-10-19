import test from 'node:test';
import assert from 'node:assert/strict';
import {storyChapter} from '../public/story-progress.js';
test('story advances and reverses on a short laptop viewport',()=>{const height=650*2.8;assert.equal(storyChapter(20,height,650,3),0);assert.equal(storyChapter(-450,height,650,3),1);assert.equal(storyChapter(-900,height,650,3),2);assert.equal(storyChapter(-400,height,650,3),1);});
test('fast scrolling and restored positions clamp to the first/last chapter',()=>{assert.equal(storyChapter(-9000,2100,750,3),2);assert.equal(storyChapter(9000,2100,750,3),0);assert.equal(storyChapter(0,500,500,3),0)});
