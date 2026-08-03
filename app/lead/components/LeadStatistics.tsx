import React, { useEffect, useState } from 'react';
import { App, Card, Table, Typography, Spin, theme } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { DateFormat } from '@/constants/enums';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { useAuthPermission } from '@/lib/hooks/use-auth-permission';
import { useLeadStatistics } from '@/lib/hooks/use-lead-statistics';
import { useLeadStatisticsSummary } from '@/lib/hooks/use-lead-statistics-summary';
import { formatCurrencyVnd } from '@/lib/utils/numberFormat';
import { LeadFunnelChart } from './LeadFunnelChart';
import { LeadStatisticsFilters } from './LeadStatisticsFilters';
import { LeadStatisticsSummaryCards } from './LeadStatisticsSummaryCards';
import { LeadStatisticsDayCard } from './LeadStatisticsDayCard';

const { Title } = Typography;

export function LeadStatistics() {
    const { message } = App.useApp();
    const isMobile = useIsMobile();
    const { token } = theme.useToken();
    const { hasPermission: isAdmin } = useAuthPermission(['ADMIN']);
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
        dayjs(),
        dayjs(),
    ]);

    const startDate = dateRange?.[0]?.format(DateFormat.ISO_DATE) || '';
    const endDate = dateRange?.[1]?.format(DateFormat.ISO_DATE) || '';

    const { data, isLoading, isError, error } = useLeadStatistics(startDate, endDate);

    useEffect(() => {
        if (isError) {
            message.error((error as Error).message || 'Lỗi khi lấy dữ liệu thống kê');
        }
    }, [isError, error, message]);

    const { chartData, fbTotalSpend, fbTotalMessages, totalLeads, funnel } =
        useLeadStatisticsSummary(data);

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
                    render: (val: number) => formatCurrencyVnd(val),
                },
            ]
            : []),
    ];

    return (
        <div style={{ marginTop: 16 }}>
            <LeadStatisticsFilters
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                isMobile={isMobile}
            />

            <LeadStatisticsSummaryCards
                isAdmin={isAdmin}
                fbTotalSpend={fbTotalSpend}
                fbTotalMessages={fbTotalMessages}
                totalLeads={totalLeads}
            />

            <LeadFunnelChart funnel={funnel} loading={isLoading} />

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
                                        <Table.Summary.Cell index={6}>{formatCurrencyVnd(tFbSpend)}</Table.Summary.Cell>
                                    )}
                                </Table.Summary.Row>
                            );
                        }}
                    />
                ) : (
                    isLoading ? (
                        <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>
                    ) : (
                        <div role="list">
                            {chartData.map((item) => (
                                <div role="listitem" key={item.date} style={{ marginBottom: 16 }}>
                                    <LeadStatisticsDayCard item={item} isAdmin={isAdmin} />
                                </div>
                            ))}
                        </div>
                    )
                )}
            </Card>
        </div>
    );
}
