import { validationResult } from 'express-validator';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
// import { alternatives } from "joi";
import User from "../models/users.js";
import Otp  from "../models/otp.js";
import sendEmail from "../helpers/sendEmail.js"
import { response } from "express";
import upload from "../middlewares/upload.js";

import { MulterError } from "multer";
import { sendConfirmationEmail } from '../helpers/sendConfirmationEmail.js';
import { generatorOTP } from '../helpers/otpGenerator.js';

const saltRounds = 10;

export async function register(req, res) {
  console.log("================sdds=asas");
  try {
    const { fullName, email, password, profilePic } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }

    User.findOne({ email: email }).then((user) => {
      if (user) {
        return res.status(400).json({
          message: "Email already exist",
          status: 400,
          success: false,
        });
      } else {
        bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(password, salt, function (err, hash) {
            
            let otp = generatorOTP();
            console.log("otp",otp);
            
            let data = new User({
              email: email,
              fullName: fullName,
              password: hash,
              profile: profilePic,
              otp: otp
            });
            data.save().then((user_data) => {
              if (user_data !== null) {
                res.status(201).json({
                  message: "user register success",
                  status: 200,
                  success: true,
                });
             
                 //Send email confirmation mail
              //    sendConfirmationEmail(
              //     user_data.fullName,
              //     user_data.email,
              //     '1001'
              //  );

              } else {
                return res.json({
                  message: "failed to add user",
                });
              }
            });
          });
        });
      }
    });

  } catch (error) {
    console.log("++++++++", error);
    return res.json({
      message: "Internal server error",
      status: 500,
      success: false,
    });
  }
}

export function login(req, res) {
  try {
    const { email, password } = req.body;
    const error = validationResult(req);

    if (!error.isEmpty()) {
      return res.status(400).json({error: error.array()})
    }
    console.log(req.body);
   
      User.findOne({ email: email }).then((user) => {
        if (user) {
          //  Check weather the usere emailid is verified or not
          // if (!user.isVerified) {
          //   res.status(401).send({
          //               message: "Pending Account. Please Verify Your Email!",
                      
          //             })
          //        //Send email confirmation mail
          //        sendConfirmationEmail(
          //         user.fullName,
          //         user.email,
          //         '1001'
          //      );
          //           }

          bcrypt.compare(password, user.password).then((data) => {
            if (data) {
              const token = jwt.sign(
                {
                  data: user._id,
                },
                "secret"
              );
              return res.status(201).json({
                message: "User successfuly login",
                token,
                data: user,
                status: 200,
                success: true,
              });
            } else {
              return res.status(400).json({
                message: "Wrong password entered",
                status: 400,
                success: false,
              });
            }
          });
        } else {
          return res.status(400).json({
            message: "Email not found",
            status: 400,
            success: false,
          });
        }
      });
  
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      status: 500,
      success: false,
    });
  }
}
export async function updateProfile(req, res) {
  try {
    const { id, email, fullName } = req.body;

    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({error:error.array()})
    }
 
      User.findOneAndUpdate(
        { _id: id },
        { $set: { email: email, fullName: fullName } }
      ).then((data) => {
        if (data !== null) {
          return res.json({
            message: "Profile update success",
            status: 200,
            success: true,
          });
        } else {
          return res.json({
            message: "Profile updated failed",
            status: 400,
            success: false,
          });
        }
      });
    
  } catch (error) {
    return res.json({
      message: "Internal server error",
      status: 500,
      success: false,
    });
  }
}
export async function uploadProfileImage(req, res) {
  try {
    const { id } = req.body;
    console.log(id);
    upload(req, res, (err) => {
      if (err instanceof MulterError) {
        console.log("multer error when uploading file:", err);
        return res.sendStatus(500);
      } else if (err) {
        console.log("unknown error when uploading file:", err);
        return res.sendStatus(500);
      }
      const file = req.file;
      const schema = alternatives(
        object({
          id: string().required(),
        })
      );
      const result = schema.validate(req.body);
      if (result.error) {
        const message = result.error.details.map((i) => i.message).join(",");
        return res.json({
          status: 400,
          success: false,
          message: message,
        });
      } else {
        User.findByIdAndUpdate(
          { _id: id },
          { $set: { profile: __baseDir + "/upload/" + file.filename } }
        ).then((data) => {
          if (data !== null) {
            return res.json({
              message: "upload profile success",
              status: 200,
              success: true,
            });
          } else {
            return res.json({
              message: "upload profle failed",
              status: 400,
              success: false,
            });
          }
        });
      }
    });
  } catch (error) {
    console.log(error);
    return res.json({
      message: "Internal server error",
      status: 500,
      success: false,
    });
  }
}
export async function verifyOtp(req, res) {
  try {
    const { otp, userId } = req.body;
    const schema = alternatives(
      object({
        otp: number().empty().required(),
        userId: string().required(),
      })
    );
    const result = schema.validate(req.body);
    if (result.error) {
      const message = result.error.details.map((i) => i.message).join(",");
      return res.json({
        status: 400,
        success: false,
        message: message,
      });
    } else {
      User.findOne({ _id: userId }).then((user_data) => {
        if (user_data !== null) {
          _findOne({ userId: userId }).then((data) => {
            if (data !== null) {
              if (data.otp === parseInt(otp)) {
                User.findOneAndDelete({ _id: data._id }).then((data) => {
                  if (data !== null) {
                    console.log("otp delete");
                  }
                });
                User.findOneAndUpdate(
                  { _id: userId },
                  { $set: { isVerified: true } }
                ).then((user) => {
                  if (user !== null) {
                    let text = "otp verified success";
                    sendEmail(
                      user_data.email,
                      "E-Visiting Account Verification",
                      text
                    );
                    return res.json({
                      message: "otp verified success",
                      status: 200,
                      success: true,
                    });
                  } else {
                    return res.json({
                      message: "otp not verified",
                    });
                  }
                });
              } else {
                User.deleteMany({ userId: userId });
                return res.json({
                  message: "Otp does not match",
                  status: 400,
                  success: false,
                });
              }
            } else {
              return res.json({
                message: "otp expired",
                status: 400,
                success: false,
              });
            }
          });
        } else {
          return res.json({
            message: "user not found on this email",
            status: 400,
            success: false,
          });
        }
      });
    }
  } catch (error) {
    return res.json({
      message: "Internal server error",
      status: 500,
      success: false,
    });
  }
}
export async function resendOtp(req, res) {
  try {
    const { userId } = req.body;
    const schema = alternatives(
      object({
        userId: string().required(),
      })
    );
    const result = schema.validate(req.body);
    if (result.error) {
      const message = result.error.details.map((i) => i.message).join(",");
      return res.json({
        status: 400,
        success: false,
        message: message,
      });
    } else {
      findOne({ _id: userId }).then(async (data) => {
        if (data !== null) {
          let otp = Math.random();
          otp = otp * 1000000;
          otp = parseInt(otp);
          _findOne({ _id: userId }).then((user_otp) => {
            if (user_otp !== null) {
              deleteMany({ userId: userId }).then((user) => {
                if (user !== null) {
                  let newOtp = new Otp({
                    userId: userId,
                    otp: otp,
                  });
                  const result = newOtp.save();
                }
              });
            } else {
              let newOtp = new Otp({
                userId: userId,
                otp: otp,
              });
              const result = newOtp.save();
            }
          });
          let text = `resend otp ${otp}`;
          let result = sendEmail(
            data.email,
            "E-Visiting otp verification",
            text
          );
          if (result) {
            return res.json({
              message: "otp resend on your mail successfully",
              status: 200,
              success: true,
            });
          }
        } else {
          return res.json({
            message: "user not found",
            status: 400,
            success: false,
          });
        }
      });
    }
  } catch (error) {
    return res.json({
      message: "Internal server error",
      status: 500,
      success: false,
    });
  }
}
export async function fetchDataById(req, res) {
  try {
    const { id } = req.body;
    const schema = alternatives(
      object({
        id: string().required(),
      })
    );
    const result = schema.validate(req.body);
    if (result.error) {
      const message = result.error.details.map((i) => i.message).join(",");
      return res.json({
        status: 400,
        success: false,
        message: message,
      });
    } else {
      User.findOne({ _id: id }).then((data) => {
        if (data !== null) {
          return res.json({
            message: "data fetch success",
            status: 200,
            success: true,
            data: data,
          });
        } else {
          return res.json({
            message: "Data failed to fetch",
            status: 400,
            success: false,
          });
        }
      });
    }
  } catch (error) {
    return res.json({
      message: "Internal server error",
      status: 500,
      success: false,
    });
  }
}


export async function fetchAllUsers(req, res) {

  try {
     let users = await User.find();
     console.log(users)
     if (users) {
       return res.status(200).json({users:users})
     }
  } catch(error) {
    console.log(error);
    return res.status(500).json({
     error:[{
       msg: "Internal server error"
     }]
    })
  }

}

/**function to verify user emailId */
export async function verifyEmail(req, res){
     try {
       const { email, otp } = req.body;
       const user = await User.findOne({
         email,
       });
       if (!user) {
         return res.status(400).send({"message":"User not found"})
       }
       if (user && user.otp !== otp) {
         return res.status(400).send({"message":"Invalid OTP"})
       }
       const updateUser = await User.findByIdAndUpdate(user._id,{
         $set: {isVerified : true}
       })

       res.status(201).send({"message":"User verified successfully"})

     } catch (error) {
      return res.status(500).json({
        error:[{
          msg: "Internal server error"
        }]
       })
     }
}
