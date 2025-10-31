import fs from "fs"; import path from "path";
const OUT="data/units_out"; fs.mkdirSync(OUT,{recursive:true});
const files=(process.argv.slice(2).length?process.argv.slice(2):fs.readdirSync("data/lessons").filter(f=>f.endsWith(".json")).map(f=>"data/lessons/"+f));
for(const f of files){
  const arr=JSON.parse(fs.readFileSync(f,"utf8"));
  const base=path.basename(f).replace(/\.json$/,""); const unitId=`manual.${base}.u1`;
  const dir=path.join(OUT, unitId); fs.mkdirSync(dir,{recursive:true});
  const size=Number(process.env.LESSON_SIZE||15);
  // 15問ごとにレッスン化、n01固定
  let i=0, l=1;
  while(i<arr.length){
    const chunk=arr.slice(i,i+size);
    const fp=path.join(dir, `n01_l${String(l).padStart(2,"0")}.jsonl`);
    fs.writeFileSync(fp, chunk.map(o=>JSON.stringify(o)).join("\n")+"\n","utf8");
    i+=size; l++;
  }
  console.log(`✓ ${unitId} へ ${l-1} lessons`);
}
