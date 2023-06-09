const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect = function(done){
    const url='mongodb+srv://anzarimuhammedanzarimuhammed:2R9rorIHDfTkiNjN@medxindia.kykhgfw.mongodb.net/'
    const dbname='MedXindia'

    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })

    
}

module.exports.get=function(){
    return state.db
}

