var fs = require("fs")
var path = require("path")
var f = require("../ucipassweb/bin/lib_files.js")
var moment = require('moment')

async function dupfinder (directory) {
	ts = moment(new Date())
	var list = await getDirListRecursive(directory)
	//var list = await getDirList(directory)
	te = moment(new Date())
	duration = moment.duration(te.diff(ts)).asMilliseconds();
	console.log("Number of files:",list.length,"Duration",duration,"ms")
	return list ;
};

function readdir(dir) {return new Promise(function(resolve,reject){
	fs.readdir(dir, function(err, list) {
		if(err){
			resolve([])
		}
		else {
			resolve( list )
		}
	})
})}

function fstat(dir) {
	var resolve,reject
	var final = new Promise(function(res,rej){ resolve=res;reject=rej})
	fs.stat(dir, function(err, stat) {
		if(err){
			resolve(null)
		}
		else {
			resolve(stat)
		}
	})
	return final;

}

function getDirListRecursive(dir, callback) {try{
	//console.log("CALLED:    ",dir)
	var resolve,reject
	var final = new Promise(function(res,rej){ resolve=res;reject=rej})
	function done(err,result){
		//console.log("ERR",err,"RESULT LENGTH",result.length,"DIR",dir)
		if (callback) {if (err) { console.log(err);callback(err,null)} else {callback(null,result)} }
		else          {if (err) { console.log(err);reject(err)}        else {resolve(result)       } }
		}
	var results = [];
	fs.readdir(dir, function(err, list) {
		if (err) {
			console.log("Error Reading File!",err)
			//return done(err);
		}
		var pending = list ? list.length : 0;
		if (!pending) { return done(null, results);}
		list.forEach(function(file) {
			file = path.resolve(dir, file);
			fs.stat(file, function(err, stat) {
				if(!stat || err){
					console.log("Error Reading File!",err)
				}
				else if (stat && stat.isDirectory()) {
					getDirListRecursive(file, function(err, res) {
						results = results.concat(res);
						if (!--pending) done(null, results);
						});
					} 
				else {
					results.push( {name: path.join(dir,file), size: stat.size, ctime: stat.ctime, mtime: stat.mtime} );
					//console.log(path.join(dir,file))
					if (!--pending) done(null, results);
					}
				});
		});
	});
	return final
}catch(err){console.log(err)}}

module.exports = dupfinder;

function getDirList(dir) {  return new Promise( async function(resolve,reject){

	var dirlist =  [dir]
	var filelist = []

	while (dirlist.length > 0) {
		var curdir = dirlist.pop()
		//console.log(curdir)
		var curlist = await readdir(curdir)
		for(var x = 0; x < curlist.length; x++){
			var entry = path.join(curdir,curlist[x])
			var stat = await fstat(entry)
			if (!stat){
				//console.log("Do nothing")
			}
			else if (stat.isDirectory()){
				//console.log("Directory:",entry)
				dirlist.push(entry)
			}else{
				//console.log("File:",entry)
				var json = {
					name: entry,
					size: stat.size,
					ctime: stat.ctime,
					mtime: stat.mtime
				}
				filelist.push(json)
			}
		}
		
	}
	resolve( filelist )

})}


if (require.main === module) {
    console.log('called directly');
	var ts = moment(new Date())
	getDirList("d:\\")
	//getDirListRecursive("d:\\")
	.then((list)=>{
		var te = moment(new Date())
		duration = moment.duration(te.diff(ts)).asMilliseconds();
		console.log("Number of files:",list.length,"Duration",duration,"ms")
	})
	.catch((err)=>{console.log("BAD ERROR",err)})
	
}