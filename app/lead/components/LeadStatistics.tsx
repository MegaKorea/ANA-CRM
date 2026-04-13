import React, { useState } from 'react';
import {
    Row,
    Col,
    Card,
    Statistic,
    DatePicker,
    Table,
    Typography,
    Space,
    message,
    theme,
    List,
    Divider,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import {
    DollarOutlined,
    UserOutlined,
    FacebookOutlined,
    WalletOutlined,
    CreditCardOutlined,
    DatabaseOutlined,
} from '@ant-design/icons';
import { DateFormat } from '@/constants/enums';
import { useQuery } from '@tanstack/react-query';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { useAuthPermission } from '@/lib/hooks/use-auth-permission';

const { RangePicker } = DatePicker;
const { Title } = Typography;

interface StatisticSummary {
}

interface ChartDataRow {
    date: string;
    totalLeads: number;
    registeredLeads: number;
    totalAppointments: number;
    arrivedAppointments: number;
    fbSpend?: number;
    fbMessages?: number;
}

interface FBApiResponse {
    spend: string;
    campaign_id: string;
    account_name: string;
    campaign_name: string;
    actions: { action_type: string; value: string }[];
    date_start: string;
    date_stop: string;
}

const fetchStatisticsData = async (startDate: string, endDate: string) => {
    const leadRes = await fetch(`/api/leads/statistics?startDate=${startDate}&endDate=${endDate}`);
    if (!leadRes.ok) {
        throw new Error('Failed to fetch lead statistics');
    }
    const leadData = await leadRes.json();

    let fbData: any[] = [];
    try {
        const fbRes = await fetch(`/api/facebook/insights?startDate=${startDate}&endDate=${endDate}`);
        if (fbRes.ok) {
            fbData = await fbRes.json();
        }
    } catch (fbErr) {
        console.warn('Facebook API error', fbErr);
    }

    let totalSpend = 0;
    let totalMessages = 0;
    const fbMap = new Map<string, { spend: number; messages: number }>();

    if (Array.isArray(fbData)) {
        fbData.forEach((row: FBApiResponse) => {
            const rowSpend = parseFloat(row.spend || '0');
            const messageAction = row.actions?.find(
                (a) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d',
            );
            const rowMessages = messageAction ? parseInt(messageAction.value || '0', 10) : 0;

            totalSpend += rowSpend;
            totalMessages += rowMessages;
            if (row.date_start) {
                const existing = fbMap.get(row.date_start) || { spend: 0, messages: 0 };
                existing.spend += rowSpend;
                existing.messages += rowMessages;
                fbMap.set(row.date_start, existing);
            }
        });
    }

    const finalChartData = (leadData.chartData as ChartDataRow[]).map((row) => {
        const fbStats = fbMap.get(row.date);
        return {
            ...row,
            fbSpend: fbStats?.spend || 0,
            fbMessages: fbStats?.messages || 0,
        };
    });

    return {
        summary: leadData.summary as StatisticSummary,
        chartData: finalChartData,
        fbTotalSpend: totalSpend,
        fbTotalMessages: totalMessages,
    };
};

export function LeadStatistics() {
    const isMobile = useIsMobile();
    const { token } = theme.useToken();
    const { hasPermission: isAdmin } = useAuthPermission(['ADMIN']);
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
        dayjs(),
        dayjs(),
    ]);

    const startDate = dateRange?.[0]?.format(DateFormat.ISO_DATE) || '';
    const endDate = dateRange?.[1]?.format(DateFormat.ISO_DATE) || '';

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['lead-statistics', startDate, endDate],
        queryFn: () => fetchStatisticsData(startDate, endDate),
        enabled: !!startDate && !!endDate,
    });

    if (isError) {
        message.error((error as Error).message || 'Lỗi khi lấy dữ liệu thống kê');
    }

    const { summary, chartData, fbTotalSpend, fbTotalMessages } = data || {
        summary: {},
        chartData: [],
        fbTotalSpend: 0,
        fbTotalMessages: 0,
    };

    const totalLeads = chartData.reduce((acc: number, curr: ChartDataRow) => acc + (curr.totalLeads || 0), 0);


    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const columns = [
        {
            title: 'Ngày',
            dataIndex: 'date',
            key: 'date',
            render: (val: string) => dayjs(val).format('DD/MM/YYYY'),
        },
        { title: 'Tương Tác', dataIndex: 'fbMessages', key: 'fbMessages' },
        { title: 'Data', dataIndex: 'totalLeads', key: 'totalLeads' },
        { title: 'Đăng ký', dataIndex: 'registeredLeads', key: 'registeredLeads' },
        { title: 'Lịch hẹn', dataIndex: 'totalAppointments', key: 'totalAppointments' },
        { title: 'Đến tư vấn', dataIndex: 'arrivedAppointments', key: 'arrivedAppointments' },

        ...(isAdmin
            ? [
                {
                    title: 'Chi Tiêu',
                    dataIndex: 'fbSpend',
                    key: 'fbSpend',
                    render: (val: number) => formatCurrency(val),
                },
            ]
            : []),
    ];

    return (
        <div style={{ marginTop: 16 }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }} gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Title level={4} style={{ margin: 0 }}>
                        Thống kê tổng quan
                    </Title>
                </Col>
                <Col
                    xs={24}
                    md={12}
                    style={{
                        display: 'flex',
                        justifyContent: isMobile ? 'flex-start' : 'flex-end',
                        width: '100%',
                    }}
                >
                    <Space
                        direction={isMobile ? 'vertical' : 'horizontal'}
                        style={{ width: isMobile ? '100%' : 'auto' }}
                    >
                        <span style={{ fontWeight: 500 }}>Bộ lọc ngày:</span>
                        {!isMobile ? (
                            <RangePicker
                                value={dateRange}
                                onChange={setDateRange as any}
                                format="DD/MM/YYYY"
                                allowClear={false}
                            />
                        ) : (
                            <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                                <DatePicker
                                    style={{ flex: 1 }}
                                    value={dateRange?.[0]}
                                    onChange={(date) => setDateRange([date, dateRange?.[1] || dayjs()])}
                                    format="DD/MM/YYYY"
                                    allowClear={false}
                                    inputReadOnly={true}
                                />
                                <span style={{ padding: '0 8px' }}>-</span>
                                <DatePicker
                                    style={{ flex: 1 }}
                                    value={dateRange?.[1]}
                                    onChange={(date) => setDateRange([dateRange?.[0] || dayjs(), date])}
                                    format="DD/MM/YYYY"
                                    allowClear={false}
                                    inputReadOnly={true}
                                />
                            </div>
                        )}
                    </Space>
                </Col>
            </Row>



            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {isAdmin && (
                    <Col xs={24} sm={12} md={8}>
                        <Card
                            size="small"
                            style={{
                                borderColor: token.colorPrimaryBorder,
                                backgroundColor: token.colorPrimaryBg,
                                borderRadius: 12,
                            }}
                        >
                            <Statistic
                                title="Chi Tiêu"
                                value={fbTotalSpend}
                                formatter={(v) => formatCurrency(Number(v))}
                                prefix={<FacebookOutlined />}
                                valueStyle={{ color: token.colorPrimaryText, fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                )}
                <Col xs={24} sm={12} md={isAdmin ? 8 : 12}>
                    <Card
                        size="small"
                        style={{
                            borderColor: token.colorWarningBorder,
                            backgroundColor: token.colorWarningBg,
                            borderRadius: 12,
                        }}
                    >
                        <Statistic
                            title="Tương Tác"
                            value={fbTotalMessages}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: token.colorWarningText, fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={isAdmin ? 8 : 12}>
                    <Card
                        size="small"
                        style={{
                            borderColor: token.colorSuccessBorder,
                            backgroundColor: token.colorSuccessBg,
                            borderRadius: 12,
                        }}
                    >
                        <Statistic
                            title="Tổng Data"
                            value={totalLeads}
                            prefix={<DatabaseOutlined />}
                            valueStyle={{ color: token.colorSuccessText, fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card style={{ marginTop: 16, borderRadius: 12 }}>
                <Title level={5} style={{ marginBottom: 16 }}>
                    Bảng thống kê theo ngày
                </Title>
                {!isMobile ? (
                    <Table
                        columns={columns}
                        dataSource={chartData}
                        rowKey="date"
                        loading={isLoading}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        bordered
                        summary={(pageData) => {
                            let tLeads = 0;
                            let tRegLeads = 0;
                            let tAppts = 0;
                            let tArrAppts = 0;

                            let tFbSpend = 0;
                            let tFbMsgs = 0;

                            pageData.forEach(
                                ({
                                    totalLeads,
                                    registeredLeads,
                                    totalAppointments,
                                    arrivedAppointments,

                                    fbSpend,
                                    fbMessages,
                                }) => {
                                    tLeads += totalLeads;
                                    tRegLeads += registeredLeads;
                                    tAppts += totalAppointments;
                                    tArrAppts += arrivedAppointments;

                                    tFbSpend += fbSpend || 0;
                                    tFbMsgs += fbMessages || 0;
                                },
                            );

                            return (
                                <Table.Summary.Row
                                    style={{ backgroundColor: token.colorFillAlter, fontWeight: 'bold' }}
                                >
                                    <Table.Summary.Cell index={0}>Tổng cộng</Table.Summary.Cell>
                                    <Table.Summary.Cell index={1}>{tFbMsgs}</Table.Summary.Cell>
                                    <Table.Summary.Cell index={2}>{tLeads}</Table.Summary.Cell>
                                    <Table.Summary.Cell index={3}>{tRegLeads}</Table.Summary.Cell>
                                    <Table.Summary.Cell index={4}>{tAppts}</Table.Summary.Cell>
                                    <Table.Summary.Cell index={5}>{tArrAppts}</Table.Summary.Cell>
                                    {isAdmin && (
                                        <Table.Summary.Cell index={6}>{formatCurrency(tFbSpend)}</Table.Summary.Cell>
                                    )}
                                </Table.Summary.Row>
                            );
                        }}
                    />
                ) : (
                    <List
                        dataSource={chartData}
                        loading={isLoading}
                        renderItem={(item) => (
                            <List.Item style={{ padding: 0, marginBottom: 16 }}>
                                <Card
                                    size="small"
                                    style={{ width: '100%', borderColor: token.colorBorder, borderRadius: 8 }}
                                >
                                    <Title
                                        level={5}
                                        style={{
                                            margin: 0,
                                            paddingBottom: 8,
                                            borderBottom: `1px solid ${token.colorBorderSecondary}`,
                                        }}
                                    >
                                        {dayjs(item.date).format('DD/MM/YYYY')}
                                    </Title>

                                    <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                                        {isAdmin && (
                                            <Col span={12}>
                                                <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>
                                                    Chi tiêu
                                                </div>
                                                <div style={{ fontWeight: 'bold', color: token.colorPrimaryText }}>
                                                    {formatCurrency(item.fbSpend || 0)}
                                                </div>
                                            </Col>
                                        )}
                                        <Col span={12}>
                                            <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>Tương tác</div>
                                            <div style={{ fontWeight: 'bold' }}>{item.fbMessages}</div>
                                        </Col>
                                    </Row>

                                    <Divider style={{ margin: '8px 0' }} />

                                    <Row gutter={[8, 8]}>
                                        <Col span={12}>
                                            <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>Data</div>
                                            <div style={{ fontWeight: 500 }}>{item.totalLeads}</div>
                                        </Col>
                                        <Col span={12}>
                                            <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>Đăng ký</div>
                                            <div style={{ fontWeight: 500 }}>{item.registeredLeads}</div>
                                        </Col>
                                        <Col span={12}>
                                            <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>
                                                Lịch hẹn / Khách đến
                                            </div>
                                            <div style={{ fontWeight: 500 }}>
                                                {item.totalAppointments} /{' '}
                                                <span style={{ color: token.colorSuccessText }}>
                                                    {item.arrivedAppointments}
                                                </span>
                                            </div>
                                        </Col>
                                    </Row>


                                </Card>
                            </List.Item>
                        )}
                    />
                )}
            </Card>
        </div>
    );
}
