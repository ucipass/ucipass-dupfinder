var fs = require("fs")
var path = require("path")
var f = require("../ucipassweb/bin/lib_files.js")
var moment = require('moment')
var crypto = require('crypto')

async function dupfinder (directory) {

	ts = moment(new Date())
	var dir = new DirList(directory)
	await dir.getDirList()
	console.log("Number of Files:",dir.list.length,"in directory:",directory)
	var duplist = dir.dupDirList()
	//duplist = dupDirListByMtime(filelist)
	//duplist = await dupDirListByHash(filelist)
	//duplist = duplist.reduce( (prev,next)=>{ return prev.concat(dupDirListBySize(next))  }, [])
	//duplist = dupDirListBySize(filelist)
	//duplist = duplist.reduce( (prev,next)=>{ return prev.concat(dupDirListByMtime(next))  }, [])
	//duplist = duplist.reduce( async (prev,next)=>{ return (await prev).concat(await dupDirListByHash(next)) }, Promise.resolve([]))
	//duplist = await duplist
	te = moment(new Date())
	duration = moment.duration(te.diff(ts)).asMilliseconds();
	console.log(duplist.length," duplicate file groups found in",duration,"ms")
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
	dupDirList(){
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

}

function sortDirList(files,sortby){
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
	return files
}

function dupDirListByMtime(files){
	sortDirList(files,"mtime")
	var set = 0 ;
	var duplist = []
	var total = files.length
	files.forEach((file,index,arr)=>{
		var nextMatch = arr[index+1] && arr[index].mtime.getTime() == arr[index+1].mtime.getTime() 
		var prevMatch = arr[index-1] && arr[index].mtime.getTime() == arr[index-1].mtime.getTime()
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

function dupDirListBySize(files){
	sortDirList(files,"size")
	var set = 0 ;
	var duplist = []
	var total = files.length
	files.forEach((file,index,arr)=>{
		var nextMatch = arr[index+1] && arr[index].size == arr[index+1].size
		var prevMatch = arr[index-1] && arr[index].size == arr[index-1].size
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

async function dupDirListByHash(files){
	var set = 0 ;
	var duplist = []
	var total = files.length
	console.log("About to hash",total,"duplicate files!")
	
	// Retrieve hashes for all files
	for(var x = 0 ; x< files.length ; x++){
		var file = files[x]
		var buffer = null
		if(file.buffer){
			buffer = file.buffer
		}
		else{
			try{
				
				buffer = fs.readFileSync(file.name)
				//console.log("TEST")
			} catch(e){ 
				console.log(e)
			}
		}
		var md5 = crypto.createHash('md5')
		md5.update(buffer, 'utf8');
		file.hash = md5.digest('hex');
		console.log("Hashed:",x+1,"of",files.length,":",file.hash,file.size,file.name)
	}
	
	sortDirList(files,"hash")

	files.forEach((file,index,arr)=>{

		var nextMatch = arr[index+1] && arr[index].hash == arr[index+1].hash
		var prevMatch = arr[index-1] && arr[index].hash == arr[index-1].hash
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

function getDirList(dir) {  return new Promise( async function(resolve,reject){

	var dirlist =  [dir]
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
    console.log('called directly',process.argv[2]);
	var dir = process.argv[2]
	var ts = moment(new Date())
	dupfinder(dir)
	.then((list)=>{
		var te = moment(new Date())
		duration = moment.duration(te.diff(ts)).asMilliseconds();
		console.log("Number of duplicates:",list.length,"Duration",duration,"ms")
		list.forEach((dup,index)=>{
			console.log("Duplicate",index)
			dup.forEach((file)=>{
				console.log("  ",file.size,file.mtime,file.hash,file.name)
			})
		})
	})
	.catch((err)=>{console.log("BAD ERROR",err)})
}

module.exports = dupfinder;
