var fs = require('fs')
var f = require('../../ucipassweb/bin/lib_files.js')
var gallery = require('../../ucipassweb/bin/gallery.js')
var assert = require('assert')
var should = require('chai').should();
var moment = require('moment')
var path = require('path')
var dupfinder = require('../dupfinder.js')
var mkdirp = require('mkdirp')

describe('Dupfinder Unit Tests', function(){
    var galleryDir = path.join(__dirname,"./gallery/files")
    var testfile1 = path.join(galleryDir,"dir1/1.jpg")
    var testfile2 = path.join(galleryDir,"dir2/2.jpg")
    var testfile3 = path.join(galleryDir,"dir3/3.jpg")
    var testfile4 = path.join(galleryDir,"dir4/4.jpg")
    var testfile5 = path.join(galleryDir,"dir5/5.jpg")
    
    before("Deleting and Setting Directories Only", async function(){
        //try{await f.rmdir(galleryDir)}catch(e){}
        mkdirp.sync(path.dirname(testfile1))   
        mkdirp.sync(path.dirname(testfile2))   
        mkdirp.sync(path.dirname(testfile3)) 
        mkdirp.sync(path.dirname(testfile4)) 
        mkdirp.sync(path.dirname(testfile5))
        if( ! await f.isFile(testfile1)) await gallery.createImageFile(testfile1,"testfile1",1024,768)
        if( ! await f.isFile(testfile2)) await gallery.createImageFile(testfile2,"testfile2",1024,768)
        if( ! await f.isFile(testfile3)) await f.copy(testfile1,testfile3)
        if( ! await f.isFile(testfile4)) await f.copy(testfile2,testfile4)
        var date1 = moment("1999-01-01 11:11:11").toDate()
        var date2 = moment("2000-02-02 22:22:22").toDate()
        fs.utimesSync(testfile1, date1, date1)
        fs.utimesSync(testfile3, date1, date1)
        fs.utimesSync(testfile2, date2, date2)
        fs.utimesSync(testfile4, date2, date2)
        
    })

    it('Main Test', async function(){try{
        var duplist = await dupfinder(galleryDir)
		duplist.forEach((dup,index)=>{
			console.log("Duplicate",index)
			dup.forEach((file)=>{
				console.log("  ",file.size,file.mtime,file.hash,file.name)
			})
		})

        assert(true)
    }catch(e){ console.log("MAIN EXCEPTION" , e )}})

})
