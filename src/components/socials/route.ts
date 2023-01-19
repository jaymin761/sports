import socialsController from "./socialsController";
import V from "./validation";
import LinkController from "../userLink/LinkController";

// path: "", method: "post", controller: "",
// validation: ""(can be array of validation),
// isEncrypt: boolean (default true), isPublic: boolean (default false)

export default [
    {
        path: "/post",
        method: "post",
        controller: socialsController.createSocialMedia,
        validation: V.socialMediaAddValidation
    },
    {
        path: "/post",
        method: "get",
        controller: socialsController.listSocialMedia,
    },
    {
        path: "/post/like",
        method: "post",
        controller: socialsController.postLike,
        validation: V.likeValidation
    },
    {
        path: "/post/comment",
        method: "post",
        controller: socialsController.postComment,
        validation: V.commnetValidation
    },
    {
        path: "/post/report",
        method: "post",
        controller: socialsController.postReport,
        validation: V.postBlockValidation
    },
    {
        path: "/post/:id",
        method: "put",
        controller: socialsController.postUpdate,
        validation: V.socialMediaAddValidation
    },
    {
        path: "/post/delete/:id",
        method: "put",
        controller: socialsController.postDelete,
        isEncrypt: false,
    },
    {
        path: "/post/:id/comment",
        method: "get",
        controller: socialsController.commentList
    },
    {
        path: "/post/share/:id",
        method: "get",
        controller: socialsController.sharePost,
        isEncrypt: false,
        isPublic: true
    }
];
