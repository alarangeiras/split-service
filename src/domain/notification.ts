import { PublishCommand } from "@aws-sdk/client-sns";
import logger from "../config/logger";
import snsClient from "../config/sns";
import type { NotificationEvent } from "../types/notification";

export async function dispatchNotificationEvent(
	notification: NotificationEvent,
) {
	const topicArn = process.env.NOTIFICATION_TOPIC_ARN;
	const publishParams = {
		TopicArn: topicArn,
		Message: JSON.stringify(notification),
	};

	try {
		const command = new PublishCommand(publishParams);
		await snsClient.send(command);
		logger.info({
			message: "Publishing message",
			topicArn,
			notification,
		});
	} catch (error) {
		logger.error(error, "Error publishing message:");
		throw error;
	}
}
