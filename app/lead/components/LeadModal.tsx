'use client';

import {
  App,
  Drawer,
  Form,
  Input,
  InputNumber,
  Rate,
  Select,
  DatePicker,
  Row,
  Col,
  Space,
  Button,
} from 'antd';
import type { Lead } from '@/lib/services/lead.service';
import { LeadSourceLabel, LeadStatusLabel, LeadPageText, Ethnicity } from '@/app/lead/constants';
import { LeadSource, LeadStatus } from '@/constants/enums';
import type { Dayjs } from 'dayjs';
import { LocationSelect, type LocationValue } from '@/components/common/LocationSelect';
import { LocationSelectV2, type LocationValueV2 } from '@/components/common/LocationSelectV2';
import { useCourses } from '@/lib/hooks/use-courses';
import { formatIntegerInput, parseIntegerInput } from '@/lib/utils/numberFormat';

const YEAR_OPTIONS = Array.from({ length: 100 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year.toString(), label: String(year) };
});

export interface LeadFormValues {
  full_name: string;
  email?: string;
  phone_number?: string;
  date_of_birth?: string;
  place_of_birth?: LocationValue;
  place_of_origin?: LocationValue;
  current_address?: LocationValue;
  current_address_temp?: LocationValueV2;
  citizen_id?: string;
  nationality?: string;
  ethnicity?: string;
  source?: string;
  status?: LeadStatus;
  course_ids?: string[];

  appointment_date?: Dayjs | null;
  facebook_url?: string;
  pid_zalo?: string;
  conversation?: string;
  tuition_fee?: number;
  rate?: number;
  created_at?: Dayjs | null;
}

interface LeadModalProps {
  open: boolean;
  editingLead: Lead | null;
  form: ReturnType<typeof Form.useForm<LeadFormValues>>[0];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: LeadFormValues) => Promise<void>;
}

export function LeadModal({
  open,
  editingLead,
  form,
  isSubmitting,
  onClose,
  onSubmit,
}: LeadModalProps) {
  const { message } = App.useApp();
  const { data: courses, isLoading: isCoursesLoading } = useCourses();

  return (
    <Drawer
      open={open}
      title={editingLead ? LeadPageText.MODAL_EDIT_TITLE : 'Tạo mới'}
      onClose={onClose}
      size={1000}
      destroyOnHidden
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" onClick={() => form.submit()} loading={isSubmitting}>
            Lưu
          </Button>
        </Space>
      }
    >
      <Form<LeadFormValues>
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        onFinishFailed={({ errorFields }) => {        
          const first = errorFields[0]?.errors[0];
          message.error(first ?? 'Vui lòng kiểm tra lại thông tin đã nhập');
        }}
        scrollToFirstError
        initialValues={{
          status: LeadStatus.NEW,
          source: LeadSource.FACEBOOK,
          ethnicity: Ethnicity[0],
          rate: 0,
        }}
      >
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Form.Item
              name="full_name"
              label={LeadPageText.FIELD_FULL_NAME_LABEL}
              rules={[{ required: true, message: LeadPageText.FIELD_FULL_NAME_PLACEHOLDER }]}
            >
              <Input placeholder={LeadPageText.FIELD_FULL_NAME_PLACEHOLDER} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="email"
              label={LeadPageText.FIELD_EMAIL_LABEL}
              rules={[{ type: 'email', message: LeadPageText.FIELD_EMAIL_PLACEHOLDER }]}
            >
              <Input placeholder={LeadPageText.FIELD_EMAIL_PLACEHOLDER} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="phone_number" label={LeadPageText.FIELD_PHONE_NUMBER_LABEL}>
              <Input placeholder={LeadPageText.FIELD_PHONE_NUMBER_PLACEHOLDER} />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item name="date_of_birth" label={LeadPageText.FIELD_DATE_OF_BIRTH_LABEL}>
              <Select
                placeholder="Chọn năm"
                allowClear
                showSearch={{ optionFilterProp: 'label' }}
                options={YEAR_OPTIONS}
              />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item name="place_of_birth" label={LeadPageText.FIELD_PLACE_OF_BIRTH_LABEL}>
              <LocationSelect onlyProvince disabled={Boolean(isSubmitting)} />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item name="citizen_id" label={LeadPageText.FIELD_CITIZEN_ID_LABEL}>
              <Input />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item name="ethnicity" label={LeadPageText.FIELD_ETHNICITY_LABEL}>
              <Select
                options={Ethnicity.map((ethnicity) => ({
                  label: ethnicity,
                  value: ethnicity,
                }))}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item name="current_address_temp" label={LeadPageText.FIELD_CURRENT_ADDRESS_LABEL}>
              <LocationSelectV2 disabled={Boolean(isSubmitting)} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="source" label={LeadPageText.FIELD_SOURCE_LABEL}>
              <Select
                options={Object.values(LeadSource).map((source) => ({
                  label: LeadSourceLabel[source as keyof typeof LeadSourceLabel],
                  value: source,
                }))}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="status" label={LeadPageText.FIELD_STATUS_LABEL}>
              <Select
                options={Object.values(LeadStatus).map((status) => ({
                  label: LeadStatusLabel[status as keyof typeof LeadStatusLabel],
                  value: status,
                }))}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="course_ids" label={LeadPageText.FIELD_COURSE_IDS_LABEL}>
              <Select
                mode="multiple"
                allowClear
                placeholder={LeadPageText.FIELD_COURSE_IDS_PLACEHOLDER}
                options={courses?.map((course) => ({
                  label: course.name,
                  value: course.id,
                }))}
                loading={isCoursesLoading}
              />
            </Form.Item>
          </Col>



          <Col span={8}>
            <Form.Item name="appointment_date" label="Lịch hẹn">
              <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="facebook_url" label="Facebook URL">
              <Input placeholder="https://facebook.com/..." />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="pid_zalo" label="PID Zalo">
              <Input placeholder="Nhập pid_zalo" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="conversation" label="Link hội thoại">
              <Input placeholder="https://..." />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="tuition_fee" label="Học phí (VND)">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="Nhập học phí"
                formatter={formatIntegerInput}
                parser={parseIntegerInput as never}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="rate" label="Mức độ tiềm năng">
              <Rate allowClear />
            </Form.Item>
          </Col>

          {editingLead && (
            <Col span={8}>
              <Form.Item name="created_at" label="Ngày tạo">
                <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>
    </Drawer>
  );
}
