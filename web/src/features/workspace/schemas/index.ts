import { type } from "arktype"

export const createWorkspaceSchema = type({
	name: "string > 0",
})

export const updateWorkspaceSchema = type({
	"name?": "string > 0",
})

export const addMemberSchema = type({
	userId: "string > 0",
	"role?": "'member' | 'admin'",
})
