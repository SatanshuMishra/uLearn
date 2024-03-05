import prisma from "../../../lib/prisma";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import CryptoJS from "crypto-js";
const DOMPurify = require("isomorphic-dompurify");
const HmacSHA256 = CryptoJS.HmacSHA256;

export async function POST(request: NextRequest) {
	try {
		const requestText = await request.text();
		const requestBody: {
			name: string;
			username: string;
			password: string;
		} = JSON.parse(requestText);

		const sanitizationConfig = { ALLOWED_TAGS: [], KEEP_CONTENT: false };
		const pureName = DOMPurify.sanitize(
			requestBody.name,
			sanitizationConfig
		);
		const pureUsername = DOMPurify.sanitize(
			requestBody.username,
			sanitizationConfig
		);
		const purePassword = DOMPurify.sanitize(
			requestBody.password,
			sanitizationConfig
		);

		if (pureName === "") {
			return new Response(
				JSON.stringify({
					data: null,
					status: 422,
					message:
						"Your input for 'Name' could not be processed due to security concerns. Please simplify your entries and resubmit.",
					pgErrorObject: null,
				})
			);
		}

		if (pureUsername === "") {
			return new Response(
				JSON.stringify({
					data: null,
					status: 422,
					message:
						"Your input for 'Username' could not be processed due to security concerns. Please simplify your entries and resubmit.",
					pgErrorObject: null,
				})
			);
		}

		if (purePassword === "") {
			return new Response(
				JSON.stringify({
					data: null,
					status: 422,
					message:
						"Your input for 'Password' could not be processed due to security concerns. Please simplify your entries and resubmit.",
					pgErrorObject: null,
				})
			);
		}

		const uuid = uuidv4();

		const result =
			await prisma.$queryRaw`INSERT INTO student (studentId, name, username, password, completedBonusContent) VALUES (UUID_TO_BIN(${uuid}), ${
				requestBody.name
			}, ${requestBody.username}, 
				${HmacSHA256(
					requestBody.password,
					process.env.PASSWORD_ENCRYPTION_KEY || "Weee"	
				).toString()}, 0)`;

		return new Response(
			JSON.stringify({
				data: { result },
				status: 201,
				message: `${pureUsername} was signed-up successfully.`,
				pgErrorObject: null
			})
		);
	} catch (error: any) {
		console.log(error);
		return new Response(
			JSON.stringify({
				data: null,
				status: 500,
				message: `Sign-up failed.`,
				pgErrorObject: {
				...error,
			},
			})
		);
	}
}
