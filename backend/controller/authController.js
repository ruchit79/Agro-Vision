import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";



export const   Signup = async (req ,res)=>{
    const {username , gmail ,  password} = req.body ;
    if(!username || !gmail || !password) return res.status(401).json({error : "All feild required"})
        try{
    const existingUser  = await User.findOne({gmail});
    if(existingUser) return res.status(401).json({error : "User is Already exisit"})
     const hashPassword = await bcrypt.hash(password , 10);
     const newUser = await User.create({
        username ,
        password : hashPassword ,
        gmail : gmail
     });
     await newUser.save();
     const token = generateToken(newUser._id);
     res.status(201).json({token , newUser});
    }catch(error)
    {
      console.log("erorr in creating new user" , error);
      res.status(500).json({error : error?.message || "Internal Error"});
    }  

}

export const login = async (req ,res) =>{
    const { gmail , password} = req.body;
    if(!gmail || !password) return res.status(401).json({error :"All the field required"});
    try{
        const user = await User.findOne({gmail});
        if (!user) {
            return res.status(401).json({ error: "Invalid Credentials" });
        }
        const ok = await bcrypt.compare(password, user.password);
        if(!ok) return res.status(401).json({error : "Invalid Credential"});
        const token = generateToken(user._id);
        res.status(201).json({token , user})
    }catch(error)
    {
        console.log(error);
        res.status(500).json({error :error?.message || "Internal Error"});
    }
}