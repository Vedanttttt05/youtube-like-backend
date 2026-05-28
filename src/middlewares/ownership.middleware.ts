import {asyncHandler} from "../utils/asyncHandler";
import ApiError from "../utils/apiError"

export const verifyOwnership = (Model) =>
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;   

        const resource = await Model.findById(id);
        if (!resource) {
            throw new ApiError(404, "Resource not found");
        }

        if (resource.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You are not allowed to perform this action");
        }

        req.resource = resource;  
        next();
    });
