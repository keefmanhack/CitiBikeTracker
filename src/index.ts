import axios from 'axios'
import fs from 'fs'
// const { Upload } = require("@aws-sdk/lib-storage");
var AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    Bucket: process.env.S3_BUCKET
})

const stations: Record<string, string> = {
    'aa8fc8b7-b66c-41d9-9885-30b8af599378': 'E_10st_2Ave.json',
    '66db3ba0-0aca-11e7-82f6-3863bb44ef7c': 'St_Marks_Pl_2Ave.json',
    '66dc1702-0aca-11e7-82f6-3863bb44ef7c': 'St_Marks_Pl_1Ave.json'
}

const getAllStationData = async () => {
    try{
        const response = await axios.get('https://gbfs.citibikenyc.com/gbfs/en/station_status.json')
        return response.data.data.stations
    }catch(err) {
        console.log(err)
    }
}

const getFile = async (name: string) => {
    const params = {Bucket: process.env.S3_BUCKET, Key: name}
    const response = await s3.getObject(params).promise()

    return response.Body.toString('utf-8')
}

const writeFile = async (file: string, fileName: string) => {
    const params = {Body: file, Bucket: process.env.S3_BUCKET, Key: fileName}
    await s3.putObject(params).promise()
}

const findDataFrame = (stationId: string, jsonData: Array<any>) => {
    let returnObj = undefined
    jsonData.forEach((dataObj) => {
        if(dataObj.station_id == stationId){
            returnObj = dataObj
            return
        }
    })
    if(returnObj === undefined){
        console.log(`Never found data for ${stationId}`)
    }

    return returnObj
}

const main = async () => {
    console.log(`'main called ${new Date}\n'`)
        //  Pull json file
        const jsonData = await getAllStationData()
        
        for(let i =0; i<Object.keys(stations).length; i++){
            const stationId = Object.keys(stations)[i]
            const fileName = stations[stationId]
            const dataFrame = findDataFrame(stationId, jsonData)
            
            const file = await getFile(fileName)
            const fileObj = JSON.parse(file)

            fileObj.records.push(dataFrame)

            await writeFile(JSON.stringify(fileObj), fileName)
        }
}
        // Periodically every five minutes
main()
setInterval(main, 5*60*1000);

