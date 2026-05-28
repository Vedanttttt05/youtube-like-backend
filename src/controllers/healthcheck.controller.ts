import { asyncHandler } from "../utils/asyncHandler"
import  apiResponse  from "../utils/apiResponse"

const healthcheck = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(true, "Server is healthy", null))
})

export { healthcheck }
