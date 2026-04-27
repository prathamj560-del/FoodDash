import jwt from "jsonwebtoken"

export const genToken = async (userId:string) => {
    try {
        const token = await jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '7d' })
        return token;
    } catch (error) {
        console.log("Token generation error:", error)
        throw new Error("Failed to generate token");
    }
}
