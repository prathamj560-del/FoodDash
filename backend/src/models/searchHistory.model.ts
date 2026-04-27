import mongoose, { Document, Schema, Model } from "mongoose";

export interface ISearchHistory extends Document {
    user: mongoose.Types.ObjectId;
    query: string;
    clickedItems: mongoose.Types.ObjectId[];
    city: string;
    createdAt: Date;
    updatedAt: Date;
}

const searchHistorySchema = new Schema<ISearchHistory>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    query: {
        type: String,
        required: true,
        trim: true
    },
    clickedItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item"
    }],
    city: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Index for faster queries
searchHistorySchema.index({ user: 1, createdAt: -1 });
searchHistorySchema.index({ query: 1, city: 1 });

const SearchHistory: Model<ISearchHistory> = mongoose.model<ISearchHistory>("SearchHistory", searchHistorySchema);

export default SearchHistory;
