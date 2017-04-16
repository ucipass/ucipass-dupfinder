var fs = require("fs")
var path = require("path")
var File = require("ucipass-file")
var moment = require('moment')
var crypto = require('crypto')

async function dupfinder (directory) {

	ts = moment(new Date())
	var dir = new DirList(directory)
	await dir.getDirList()
	console.log("Number of Files:",dir.list.length,"in directory:",directory)
	var duplist = await dir.dupDirListHash("size")
	te = moment(new Date())
	duration = moment.duration(te.diff(ts)).asMilliseconds();
	//return Promise.all(duplist) ;
	return Promise.all(duplist) ;	
};

class DirList{
	constructor(path){
		this.path = path
		this.list = []
		this.sortby = "size"
	}

	getDirList(){  var _this = this ; return new Promise( async function(resolve,reject){

		var dirlist =  [_this.path]
		var filelist = []

		while (dirlist.length > 0) {
			var curdir = dirlist.pop()
			var curlist = await readdir(curdir)
			for(var x = 0; x < curlist.length; x++){
				var entry = path.join(curdir,curlist[x])
				var stat = await fstat(entry)
				if (!stat){
				}
				else if (stat.isDirectory()){
					dirlist.push(entry)
				}else{
					var file = new File(entry)
					file.name = path.basename(entry)
					file.size = stat.size
					file.ctime = stat.ctime
					file.mtime = stat.mtime
					/*
					var json = {
						name: entry,
						size: stat.size,
						ctime: stat.ctime,
						mtime: stat.mtime
					}
					*/
					filelist.push(file)
				}
			}	
		}
		_this.list = filelist
		resolve( filelist )
	})}
	
	sortDirList(){
		var files = this.list
		var compare = this.compareFn.bind(this)
		files.sort(compare)
		return files
	}
	compareFn(a,b){
		var sortby = this.sortby 
		var aval = null
		var bval = null
		if(sortby == "name"){
			aval = a.name
			bval = b.name			
		}else if (sortby == "size"){
			aval = a.size
			bval = b.size			

		}else if (sortby == "ctime"){
			aval = a.ctime.getTime()
			bval = b.ctime.getTime()			

		}else if (sortby == "mtime"){
			aval = a.mtime.getTime()
			bval = b.mtime.getTime()			

		}else if (sortby == "hash"){
			aval = a.hash
			bval = b.hash			

		}else{
			throw "Invalid Sort Selection: "+this.sortby
		}

		if( aval > bval ) {
			return 1
		}
		else if ( aval < bval ) {
			return -1
		}
		else {
			return(0)
		}
	}
	dupDirList(sortby){
		this.sortby = sortby ? sortby : this.sortby
		this.sortDirList()
		var files = this.list
		var compareFn = this.compareFn.bind(this)
		var set = 0 ;
		var duplist = []
		var total = files.length
		files.forEach((file,index,arr)=>{
			var nextMatchEqual = arr[index+1] && !compareFn( arr[index] , arr[index+1] )  
			var prevMatchEqual = arr[index-1] && !compareFn( arr[index] , arr[index-1] )  
			if( nextMatchEqual ){
				//console.log(index,"of",total,"Set:",set,file.mtime, file.name)
				if (!duplist[set]){
					duplist.push([file])
				}else{
					duplist[set].push(file)
				}
			}
			else if( prevMatchEqual ){
				//console.log(index,"of",total,"Set:",set,file.mtime, file.name)
				duplist[set].push(file)
				set++
			}
		})

		return duplist;
	}
	async dupDirListHash(){


		var duplist = this.dupDirList("mtime")
		duplist = duplist.reduce( (prev,next)=>{ return prev.concat(dupDirList(next,'size'))  }, [])
		for (var i = 0 ; i <duplist.length ; i++){
			var list = duplist[i]
			for (var x = 0 ; x <list.length ; x++){
				var file = list[x]
				await file.hashfn()
			}
		}
		duplist = duplist.reduce( (prev,next)=>{ return prev.concat(dupDirList(next,'hash'))  }, [])
		return duplist;
	}

}

function sortDirList(files,sortby){

	return files
}

function dupDirList(files,sortby){
	function compare(a,b){

		var aval = null
		var bval = null
		if(sortby == "name"){
			aval = a.name
			bval = b.name			
		}else if (sortby == "size"){
			aval = a.size
			bval = b.size			

		}else if (sortby == "ctime"){
			aval = a.ctime.getTime()
			bval = b.ctime.getTime()			

		}else if (sortby == "mtime"){
			aval = a.mtime.getTime()
			bval = b.mtime.getTime()			

		}else if (sortby == "hash"){
			aval = a.hash
			bval = b.hash			

		}else{
			throw "Invalid Sort Selection"
		}

		if( aval > bval ) {
			return 1
		}
		else if ( aval < bval ) {
			return -1
		}
		else {
			return(0)
		}
	}
	
	files.sort(compare)
	var set = 0 ;
	var duplist = []
	var total = files.length
	files.forEach((file,index,arr)=>{
		var nextMatch = arr[index+1] && ( ! compare( arr[index] , arr[index+1]  )   )
		var prevMatch = arr[index-1] &&  ( ! compare( arr[index] , arr[index-1]  )   )
		if( nextMatch ){
			//console.log(index,"of",total,"Set:",set,file.mtime, file.name)
			if (!duplist[set]){
				duplist.push([file])
			}else{
				duplist[set].push(file)
			}
		}
		else if( prevMatch ){
			//console.log(index,"of",total,"Set:",set,file.mtime, file.name)
			duplist[set].push(file)
			set++
		}
	})

	return duplist;
}

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

function fstat(dir) {return new Promise(function(resolve,reject){
	fs.stat(dir, function(err, stat) {
		if(err){
			resolve(null)
		}
		else {
			resolve(stat)
		}
	})
})}

if (require.main === module) {
    console.log('called directly with directory',process.argv[2]);
	var dir = process.argv[2]
	var ts = moment(new Date())
	dupfinder(dir)
	.then((list)=>{
		var te = moment(new Date())
		duration = moment.duration(te.diff(ts)).asMilliseconds();
		list.forEach((dup,index)=>{
			dup.forEach((file)=>{
				console.log("DUP,"+index.toString()+","+file.size.toString()+","+file.mtime.toISOString()+","+file.hash+","+file.fpath)
			})
		})
		console.log("Number of duplicates:",list.length,"Duration",duration,"ms")
	})
	.catch((err)=>{console.log("BAD ERROR",err)})
}

module.exports = dupfinder;
