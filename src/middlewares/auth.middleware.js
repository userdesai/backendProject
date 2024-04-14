import { ApiError } from "../utils/ApiError"
import { asyncHandler } from "../utils/asyncHandler"
import { User } from "../models/user.model"

import jwt from 'jsonwebtoken'
export const verifyJwt=asyncHandler(async(req,res,next)=>{
try {
    const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Beares ","")
    if(!token){
        throw new ApiError(401,"Unauthorized request")
    }
    const decodedToken=jwt.verify(token,process.env,ACCESS_TOKEN_SECRET)
    
    const user= await User.findById(decodedToken?._id).select("-password -refreshToken")
    
    if (!user) {
        throw new ApiError(401,"Invalid Acces token")
    }
    
    req.user=user;
    next()
} catch (error) {
    throw new ApiError(401,error?.message || "Invalid acces token")
}
})