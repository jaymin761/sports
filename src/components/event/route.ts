import EventController from "./eventController";

import V from "./validation"

export default [
    {
        path: "/event",
        method: "post",
        controller: EventController.createEvent,
        validation: V.eventValidation
    },
    {
        path: "/event/:id",
        method: "put",
        controller: EventController.updateEvent,
        validation: V.updateEventValidation
    },
    {
        path: "/event/cancel/:id",
        method: "put",
        controller: EventController.cancelEvent,
        validation: V.eventCancel
    },
    {
        path: "/event",
        method: "get",
        controller: EventController.myEvents
    },
    {
        path: "/allEvent",
        method: "get",
        controller: EventController.allEvents
    },
    {
        path: "/event/:id",
        method: "get",
        controller: EventController.eventDetails
    },
    {
        path: "/event/block",
        method: "post",
        controller: EventController.blockEvent,
        validation: V.eventBlock
    },
    {
        path: "/event/invitation",
        method: "post",
        controller: EventController.eventInvitation,
        validation: V.eventInvitation
    },
    {
        path: "/multiple/image/upload",
        method: "post",
        controller: EventController.uploadMultipleImage,
        isEncrypt: false,
    },
    {
        path: "/multiple/file/upload",
        method: "post",
        controller: EventController.uploadMultiplefile,
        isEncrypt: false,
    },
    {
        path: "/event/status/list",
        method: "get",
        controller: EventController.StatusWiseEvent
    },
    {
        path: "/event/:id",
        method: "delete",
        controller: EventController.eventDelete
    },
    {
        path: "/event/accepted/:id",
        method: "put",
        controller: EventController.eventInvitationAccept,
        validation: V.eventInvitationAccept
    },
    {
        path: "/event/invitation/list",
        method: "get",
        controller: EventController.eventInvitationList
    }
]