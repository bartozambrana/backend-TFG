const { Schema, model } = require("mongoose");

const ReplyComment = new Schema({
  text: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: "propertyModel",
  },
  propertyModel: {
    type: String,
    required: true,
    enum: ["User", "Service"],
  },
  status: {
    type: Boolean,
    default: true,
  },
});

ReplyComment.methods.toJSON = function () {
  const { __v, _id, status, ...replyComment } = this.toObject();
  replyComment.uid = _id;
  return replyComment;
};

module.exports = model("ReplyComment", ReplyComment);
