/* Actual fixed-batch demo mathematics, executed without a browser. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/foundations.js'),'utf8');
const code=source.match(/\/\* STATE MODEL START \*\/([\s\S]*?)\/\* STATE MODEL END \*\//)[1];
const model=vm.runInNewContext(code+';({config:STATE_DEMO,predict:stateDemoPrediction,batch:stateDemoBatch,update:stateDemoUpdate})');
assert.equal(model.config.rate,.1);assert.equal(model.config.limit,8);
const data=JSON.stringify(model.config.examples);
assert.deepEqual(JSON.parse(data),[{x:1,target:2},{x:2,target:4},{x:3,target:6}]);
let weight=1;
for(let step=0;step<=model.config.limit;step++){
  const batch=model.batch(weight),expected=2-Math.pow(8/15,step);
  assert.ok(Math.abs(weight-expected)<1e-12);
  assert.ok(Math.abs(batch.loss-7/3*Math.pow(8/15,2*step))<1e-12);
  assert.ok(Math.abs(batch.gradient-14/3*(weight-2))<1e-12);
  assert.equal(JSON.stringify(model.config.examples),data);
  for(let input=1;input<=5;input+=.5){
    assert.equal(model.predict(weight,input),weight*input);
    assert.equal(model.update(weight,input).after.weight,model.update(weight).after.weight,'Probe input cannot affect the training batch');
    assert.equal(model.batch(weight).loss,batch.loss);
  }
  if(step<model.config.limit){
    const result=model.update(weight);
    assert.equal(result.before.weight,weight);
    assert.ok(result.after.weight>weight&&result.after.weight<2);
    assert.ok(result.after.loss<result.before.loss);
    assert.ok(Math.abs(result.after.loss/result.before.loss-64/225)<1e-12);
    weight=result.after.weight;
  }
}
assert.ok(Math.abs(weight-1.9934537916537114)<1e-12);
assert.ok(model.batch(weight).loss>0,'Eight demo steps are not exact convergence');
assert.ok(Math.abs(model.predict(weight,5)-9.967268958268557)<1e-12);
assert.equal(model.predict(7,4),28,'The forward pass uses its weight, not the teaching rule');
assert.equal(model.batch(2).loss,0);
console.log('OK: 8 guided updates, exact batch loss/gradient, fixed data, probe independence and nonzero final error');
