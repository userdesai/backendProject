import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app=express
//middleware or configuration me app.use() karte hain
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

export {app}