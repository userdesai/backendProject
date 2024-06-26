import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import { response } from "express";

const generateAccessAndRefreshTokens=async(userId)=>{
    try{
     const user=   await User.findById(userId)
     const refreshToken =user.generateRefreshToken()
     const accessToken=user.generateAccessToken()
     user.refreshToken=refreshToken
     await user.save({validateBeforeSave:false})

     return {accessToken,refreshToken}
    
    }catch{
        throw new ApiError(500,"somenthing went wrong while refresh and access token")
    }
}

const registerUser=asyncHandler(async(req,res)=>{

    //1-get user details from frontend
    //2-validation-not empty
    //check if user alredy exits: username,email
    //check for images,check for avtar
    //upload them to cloudnary,avtar
    //crate user object- create entry in db
    //remove password and refresh token field
    //check for user creation
    //return response

    const {fullname,email,username,password}=req.body
    console.log("email",email);

    // if (fullname==="") {
    //     throw new ApiError(400,"Fullname is required")
    // }

    if(
        [fullname,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fills are compalsory")
    }

const existedUser= await User.findOne({
    $or:[{username},{email}]
})
if(existedUser){
    throw new ApiError(409,"User is already exists")
}



//image handel
const avatarLocalPath=req.files?.avatar[0]?.path;
//const coverImageLocalPath=req.files?.coverImage[0]?.path;

let coverImageLocalPath;
if (req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0) {
    coverImageLocalPath=req.files.coverImage[0].path;
    
}


if(!avatarLocalPath){
    throw new ApiError(400,"Avtar is compolsary")
}

//cloudnary upload

const avatar=await uploadOnCloudinary(avatarLocalPath)
const coverImage=await uploadOnCloudinary(coverImageLocalPath)

if(!avatar){
    throw new ApiError(400,"Avtar is compolsary")
}


const user=await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url||"",
    email,
    password,
    username:username.toLowerCase()
})

const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!createdUser){
    throw new ApiError (500,"Something went wrong while register user")
}

return res.status(201).json(
    new ApiResponse(200,createdUser,"User register succesfully")
)
    // res.status(200).json({
    //     message:"ok"
    // })
})



const loginUser=asyncHandler(async(req,res)=>{
//req body data
//username ,email
//find the user
//password check
//accss and refresh token 
//send cookie


const {email,username,password}=req.body
if (!username || !email) {
    throw new ApiError(400,"username or password is required")
}
const user=await User.findOne({
    $or:[{username},{email}]
})

if (!user) {
    throw new ApiError(404,"user not exists")
}
const isPasswordValid=await user.isPasswordCorrect(password)
if (!isPasswordValid) {
    throw new ApiError(401,"Invalid user credentials")
}

const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)


constloggedInUser =await User.findById(user._id)
select("-password -refreshToken")
const options={
    httpOnly:true,
    secure:true
}

return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new ApiResponse(
        200,
        {
            user:loginUser,accessToken,refreshToken
        },
        "user logged in sussesfully"
    )
)


})


const logoutUser=asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }

    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logged out"))
})




export {registerUser,loginUser,logoutUser}