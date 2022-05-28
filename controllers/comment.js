const { request, response } = require("express");
const Comments = require("../models/Comments");
const Dates = require("../models/dates");
const { findByIdAndUpdate } = require("../models/ReplyComment");
const ReplyComment = require("../models/ReplyComment");
const Service = require("../models/services");

const getComments = async (req = request, res = response) => {
  const { idService, userComments } = req.query;

  try {
    let comments = [];
    // we receive idService and user
    if (idService && userComments) {
      comments = await Comments.find({ idService, status: true })
        .populate({ path: "replyTo", match: { author: req.uid, status: true } })
        .or({ author: req.uid });
    } else if (idService) {
      // only service
      comments = await Comments.find({ idService, status: true })
        .populate({
          path: "replyTo",
          match: { status: true },
          populate: { path: "author", select: "userName serviceName -_id" },
        })
        .populate({ path: "author", select: "userName -_id" });
    } else if (userComments) {
      comments = await Comments.find({ status: true })
        .populate({ path: "idService", select: "serviceName" })
        .populate({ path: "replyTo", match: { author: req.uid, status: true } })
        .or({ author: req.uid });
    }

    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, msg: "contact with the amdmin" });
  }
};

const putComment = async (req = request, res = response) => {
  const { id } = req.params;
  const { text } = req.body;

  try {
    const reply = await ReplyComment.findById(id);
    const comment = await Comments.findById(id);
    let msg = "";
    if (reply) {
      //Verify if the author is him or his businnes.
      const service = await Service.findById(reply.author);
      if (!service && reply.author != req.uid) {
        return res
          .status(400)
          .json({ success: false, msg: "that comment is not yours" });
      }

      //update comment
      msg = await ReplyComment.findByIdAndUpdate(
        id,
        { text },
        { new: true }
      ).populate({ path: "author", select: "serviceName userName -_id" });
    } else if (comment) {
      //Verify if the author is him or his businnes.
      if (comment.author != req.uid) {
        return res
          .status(400)
          .json({ success: false, msg: "that comment is not yours" });
      }

      //update comment
      msg = await Comments.findByIdAndUpdate(id, { text }, { new: true })
        .populate({ path: "author", select: "userName -_id" })
        .populate({ path: "idService", select: "serviceName" });
    } else {
      return res
        .status(400)
        .json({ success: false, msg: "id does not exists" });
    }

    res.json({ success: true, comment: msg });
  } catch (error) {
    res.status(500).json({ success: false, msg: "contact with the amdmin" });
  }
};

const postComments = async (req = request, res = response) => {
  const { id: idService } = req.params;
  const { text } = req.body;
  try {
    const service = await Service.findById(idService);
    if (service.idUser == req.uid)
      return res.status(400).json({
        success: false,
        msg: "A bussiness only can put reply not comment to himself",
      });

    //Verify that the user have a pass date in the time.
    const currentDate = new Date();
    const time = currentDate.getHours() * 60 + currentDate.getMinutes();

    //Parallel Queries.
    const [apointments, totalComments] = await Promise.all([
      Dates.find({
        idUser: req.uid,
        date: { $lte: currentDate },
        endHour: { $lte: time },
      }),
      Comments.find({ idUser: req.uid, status: true }),
    ]);

    if (apointments.length <= totalComments.length)
      return res.status(400).json({
        success: false,
        msg: "Only a comment by date. Limit attached",
      });

    //Create Comment Object.
    let comment = new Comments({ idService, author: req.uid, text });
    await comment.save();

    //Send informaction like others comments.
    comment = await Comments.findById(comment.id)
      .populate({ path: "author", select: "userName -_id" })
      .populate({ path: "idService", select: "serviceName" });

    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, msg: "contact with admin" });
  }
};

/* Documented */
const postReplyTo = async (req = request, res = response) => {
  const { id } = req.params;
  const { text } = req.body;

  try {
    //obtain comment
    const comment = await Comments.findById(id).select("idService -_id");
    //obtain service to the owner if the user is the bussiness owner
    const service = await Service.findOne({
      id: comment.idService,
      idUser: req.uid,
    });

    let reply = "";
    if (service)
      reply = new ReplyComment({
        text,
        author: service.id,
        propertyModel: "Service",
      });
    else
      reply = new ReplyComment({
        text,
        author: req.uid,
        propertyModel: "User",
      });

    await reply.save();

    await Comments.findByIdAndUpdate(id, { $push: { replyTo: reply.id } });

    reply = await ReplyComment.findById(reply.id).populate({
      path: "author",
      select: "serviceName userName -_id",
    });

    res.json({ success: true, reply });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, msg: "contact with admin" });
  }
};

const deleteComments = async (req = request, res = response) => {
  const { id } = req.params;

  try {
    const reply = await ReplyComment.findById(id);
    const comment = await Comments.findById(id);
    if (reply) {
      //Verify if the author is him or his businnes.
      const service = await Service.findById(reply.author);
      if (!service && reply.author != req.uid) {
        return res
          .status(400)
          .json({ success: false, msg: "that comment is not yours" });
      }

      //delete comment
      await ReplyComment.findByIdAndUpdate(id, { status: false });
    } else if (comment) {
      //Verify if the author is him or his businnes.
      if (comment.author != req.uid) {
        return res
          .status(400)
          .json({ success: false, msg: "that comment is not yours" });
      }

      //delete comment
      const replies = await Comments.findByIdAndUpdate(
        id,
        { status: false },
        { new: true }
      );
      for (reply of replies.replyTo)
        await ReplyComment.findByIdAndUpdate(reply.id, { status: false });
    } else {
      return res
        .status(400)
        .json({ success: false, msg: "id does not exists" });
    }

    res.json({ success: true, msg: "comment deleted" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "contact with the amdmin" });
  }
};

module.exports = {
  getComments,
  putComment,
  postComments,
  deleteComments,
  postReplyTo,
};
