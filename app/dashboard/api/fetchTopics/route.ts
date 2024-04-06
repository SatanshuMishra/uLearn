import QuestionTopic from "@/app/types/questionTopic";
import prisma from "../../../lib/prisma";
import { NextRequest } from "next/server";
import Student from "@/app/types/student";

export async function POST(request: NextRequest) {
	try {
		// let topics: QuestionTopic[] =
		// 	await prisma.$queryRaw`SELECT BIN_TO_UUID(topicID) AS topicID, name FROM questionTopic`;

		const requestText = await request.text();
		const requestBody: {
			studentID: Student["studentID"];
		} = JSON.parse(requestText);


		let topics: {
			topicID: QuestionTopic["topicID"];
			name: QuestionTopic["name"];
			quizzesCompleted: number;
			bonusReq: number;
		}[] = await prisma.$queryRaw`
SELECT 
    BIN_TO_UUID(qt.topicID) AS topicID,
    qt.name AS name,
    FLOOR(COALESCE(COUNT(st.statID), 0) / 20) AS quizzesCompleted,
    CASE WHEN FLOOR(COALESCE(COUNT(st.statID), 0) / 20) >= 4 THEN TRUE ELSE FALSE END AS bonusReq
FROM 
    questionTopic qt
LEFT JOIN 
    statistic st ON qt.topicID = (SELECT DISTINCT topicID FROM question WHERE questionID = st.questionID)
    AND st.studentID = UUID_TO_BIN(${requestBody.studentID})
GROUP BY 
    qt.topicID, qt.name;
`;


		if (!topics || topics.length === 0)
			return new Response(
				JSON.stringify({
					data: null,
					status: 400,
					message:
						"Something went wrong with fetching topics. Length Error.",
					pgErrorObject: null,
				})
			);

		return new Response(
			JSON.stringify({
				data: topics,
				status: 200,
				message: "Topics successfully returned.",
				pgErrorObject: null,
			})
		);
	} catch (e) {
		console.log(e);
		return new Response(
			JSON.stringify({
				data: null,
				status: 400,
				message: "Something went wrong with fetching topics.",
				pgErrorObject: e,
			})
		);
	}
}
