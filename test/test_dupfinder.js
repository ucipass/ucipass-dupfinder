var fs = require('fs')
var assert = require('assert')
var should = require('chai').should();
var moment = require('moment')
var path = require('path')
var dupfinder = require('../dupfinder.js')

describe('Dupfinder Unit Tests', function(){

    
    before("Deleting and Setting Directories Only", async function(){
        
    })

    it('Test Init DB File', async function(){try{
        var arr = await dupfinder("d:\\node\\ucipassweb")
        console.log(arr)
        assert(true)
    }catch(e){ console.log("MAIN EXCEPTION" , e )}})

})
