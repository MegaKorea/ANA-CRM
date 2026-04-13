import { Modal, Avatar, Spin, Empty, Skeleton } from "antd";
import { useState } from "react";
import {
    UserOutlined,
    RobotOutlined,
    PaperClipOutlined,
    MessageOutlined,
} from "@ant-design/icons";
import "./ModalConversations.scss";
import { facebookService, type FacebookConversationMessagesResponse } from "@/lib/services/facebook.service";

const getCidFromUrl = (url: string) => {
    if (!url || typeof url !== "string") {
        return null;
    }
    const parts = url.split("c_id=");
    return parts.length > 1 ? parts[1] : null;
};

interface ModalViewConversationsProps {
    conversation: string;
    open: boolean;
    onCancel: () => void;
}

interface AttachmentType {
    id: string;
    mime_type?: string;
    name?: string;
    size?: number;
    image_data?: {
        url?: string;
        preview_url?: string;
        width?: number;
        height?: number;
    };
}

interface ConversationMessagesType {
    message?: string;
    from?: { id: string; name?: string };
    ai_generated?: boolean;
    attachments?: {
        data: AttachmentType[];
    };
    to?: {
        data: Array<{ id: string; name?: string }>;
    };
    created_time?: string;
}

import { useQuery } from "@tanstack/react-query";

const ModalConversations = ({
    conversation,
    open,
    onCancel,
}: ModalViewConversationsProps) => {
    const cid = getCidFromUrl(conversation);

    const { data: conversationData, isLoading: loading } = useQuery({
        queryKey: ['facebook-conversation', cid],
        queryFn: () => facebookService.getFullConversation(cid),
        enabled: !!cid && open,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const pageToken = conversationData?.pageToken;
    const avatarPage = conversationData?.avatarPage ?? "";
    const conversationMessages = conversationData?.messages ?? [];

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const renderAttachments = (attachments: { data: AttachmentType[] }) => {
        if (!attachments?.data || attachments.data.length === 0) return null;

        const images = attachments.data.filter((att) =>
            att.mime_type?.startsWith("image/")
        );
        const nonImages = attachments.data.filter(
            (att) => !att.mime_type?.startsWith("image/")
        );

        return (
            <div>
                {images.length > 0 && (
                    <div
                        className={`message-images ${images.length > 1 ? "multiple-images" : ""
                            } ${images.length === 2
                                ? "two-images"
                                : images.length === 3
                                    ? "three-images"
                                    : images.length === 4
                                        ? "four-images"
                                        : images.length >= 5
                                            ? "five-plus-images"
                                            : ""
                            }`}
                    >
                        {images.slice(0, 4).map((img, index) => (
                            <div key={img.id} className="message-image">
                                <img
                                    src={img.image_data?.preview_url || img.image_data?.url}
                                    alt={img.name}
                                    loading="lazy"
                                    onError={(e) => {
                                        const target = e.currentTarget as HTMLImageElement;
                                        target.style.display = "none";
                                    }}
                                />
                                {/* Show counter for 5+ images on the 4th image */}
                                {images.length > 4 && index === 3 && (
                                    <div className="image-counter-overlay">
                                        +{images.length - 4}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Render non-image files */}
                {nonImages.map((file) => (
                    <div key={file.id} className="attachment-file">
                        <PaperClipOutlined className="attachment-file-icon" />
                        <div className="attachment-file-info">
                            <div className="attachment-file-name">{file.name}</div>
                            <div className="attachment-file-size">
                                {formatFileSize(file.size ?? 0)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const formatTime = (timestamp: string): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            });
        } else {
            return date.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        }
    };

    const renderMessage = (msg: ConversationMessagesType, index: number) => {
        const isFromPage = msg.from?.id === cid?.split("_")[0];
        const isAI = msg.ai_generated;

        return (
            <div
                key={index}
                className={`message-wrapper ${isFromPage ? "message-from-page" : "message-from-user"
                    }`}
            >
                <div className="message-container">
                    {isFromPage && (
                        <Avatar
                            size={32}
                            src={avatarPage}
                            icon={isAI ? <RobotOutlined /> : <UserOutlined />}
                            className="message-avatar page-avatar"
                        />
                    )}
                    {!isFromPage && (
                        <Avatar
                            size={32}
                            icon={<UserOutlined />}
                            className="message-avatar user-avatar"
                        />
                    )}

                    <div className="message-content">
                        <div className="message-header">
                            <span className="sender-name">
                                {msg.from?.name}
                                {isAI && <span className="ai-badge">AI</span>}
                            </span>
                            <span className="message-time">
                                {msg.created_time && formatTime(msg.created_time)}
                            </span>
                        </div>

                        <div
                            className={`message-bubble ${isFromPage ? "page-bubble" : "user-bubble"
                                }`}
                        >
                            {msg.message && <div>{msg.message}</div>}

                            {msg.attachments && renderAttachments(msg.attachments)}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (!conversation) {
        return null;
    }

    return (
        <Modal
            width={900}
            height={700}
            centered
            open={open}
            onCancel={onCancel}
            maskClosable={false}
            footer={null}
            title={
                <div className="modal-header">
                    <div className="conversation-title">
                        <span className="conversation-title-icon">
                            <MessageOutlined style={{ color: "var(--primary-color, #1877f2)" }} />
                        </span>
                        <span>Cuộc trò chuyện</span>
                    </div>
                    <div className="conversation-subtitle">
                        {loading && <Skeleton.Input active size="small" style={{ width: 150 }} />}
                        {!loading && conversationMessages.length > 0 &&
                            conversationMessages[0]?.from?.name}
                    </div>
                </div>
            }
            className="facebook-chat-modal"
        >
            <div className="chat-container">
                {loading ? (
                    <div className="loading-skeleton-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <Skeleton avatar active paragraph={{ rows: 1 }} />
                        <div style={{ display: 'flex', flexDirection: 'row-reverse' }}>
                            <Skeleton avatar active paragraph={{ rows: 2 }} style={{ width: '60%' }} />
                        </div>
                        <Skeleton avatar active paragraph={{ rows: 1 }} />
                    </div>
                ) : conversationMessages.length === 0 ? (
                    <Empty
                        description="Không có tin nhắn nào"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                ) : (
                    <div className="messages-list">
                        {conversationMessages.map(renderMessage)}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ModalConversations;
