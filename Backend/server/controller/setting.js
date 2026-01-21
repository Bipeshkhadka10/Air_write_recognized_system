const Setting = requrie('../model/setting');

// controller logic for settings can be added here
exports.editSettings = async(req,res)=>{
    try {
        const userId = req.user.userId;
        const updates = {};
        //Dynamic updates
        const allowedUpdates = ['gestureSensitivity','theme','canvasSize']
        for(const key of allowedUpdates){
            if(req.body[key]!== undefined){
                updates[key] = req.body[key];
            }
        }
        const response = await Setting.findOneAndUpdate({userId:userId},updates,{
                new:true,
                runValidators:true,
            }
        )
        if(response){
            res.status(200).json({
                message:"Settings updated successfully",
                data:response
            })
        
        }
    } catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message,
        })  
    }
}