import LinkController from "./LinkController";
import V from "./validation";

// path: "", method: "post", controller: "",
// validation: ""(can be array of validation),
// isEncrypt: boolean (default true), isPublic: boolean (default false)

export default [
  {
    path: "/friends/contacts", //list of friend with status
    method: "post",
    controller: LinkController.syncContacts,
    validation:V.syncContactValidation
  },
  {
    path: "/friends/:id", // approve friend request
    method: "put",
    controller: LinkController.approveFriend,
    isEncrypt:false
  },
  {
    path: "/friends/:id", //reject friend request
    method: "delete",
    controller: LinkController.rejectFriend,
    isEncrypt:false
  },
  {
    path: "/friends/:id", // add friend
    method: "post",
    controller: LinkController.addFriend,
    isEncrypt:false
  },
  {
    path: "/unlink", // delete friend
    method: "post",
    controller: LinkController.deleteFriend,
    skipComponentId: true,
  },
  {
    path: "/friends/action", //list of friend with status
    method: "get",
    controller: LinkController.getFriendsWithAction,    
  },
  {
    path: "/links/:id?/:type?", //list of friend with status
    method: "get",
    controller: LinkController.linkList,
  }
];
