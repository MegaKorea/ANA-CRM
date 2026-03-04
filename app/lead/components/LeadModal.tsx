'use client';

import { Modal, Form, Input, Select, DatePicker, Row, Col } from 'antd';
import type { Lead } from '@/lib/services/lead.service';
import { LeadSourceLabel, LeadStatusLabel, LeadPageText, Ethnicity } from '@/app/lead/constants';
import { LeadSource, LeadStatus } from '@/constants/enums';
import type { Dayjs } from 'dayjs';
import { LocationSelect, type LocationValue } from '@/components/common/LocationSelect';
import { useCourses } from '@/lib/hooks/use-courses';

export interface LeadFormValues {
  full_name: string;
  email?: string;
  phone_number?: string;
  date_of_birth?: string;
  place_of_birth?: LocationValue;
  place_of_origin?: LocationValue;
  current_address?: LocationValue;
  citizen_id?: string;
  nationality?: string;
  ethnicity?: string;
  source?: string;
  status?: LeadStatus;
  note?: string;
  course_ids?: string[];
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
  const { data: courses, isLoading: isCoursesLoading } = useCourses();

  return (
    <Modal
      open={open}
      title={editingLead ? LeadPageText.MODAL_EDIT_TITLE : LeadPageText.MODAL_CREATE_TITLE}
      onCancel={onClose}
      width={1000}
      onOk={() => {
        form.submit();
      }}
      okButtonProps={{
        loading: isSubmitting,
      }}
      destroyOnHidden
      centered
    >
      <Form<LeadFormValues>
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={{
          status: LeadStatus.NEW,
          source: LeadSource.WEBSITE,
          ethnicity: Ethnicity[0],
        }}
      >
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Form.Item
              name="full_name"
              label={LeadPageText.FIELD_FULL_NAME_LABEL}
              rules={[
                { required: true, message: LeadPageText.FIELD_FULL_NAME_PLACEHOLDER },
              ]}
            >
              <Input placeholder={LeadPageText.FIELD_FULL_NAME_PLACEHOLDER} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="email"
              label={LeadPageText.FIELD_EMAIL_LABEL}
              rules={[
                { type: 'email', message: LeadPageText.FIELD_EMAIL_PLACEHOLDER },
              ]}
            >
              <Input placeholder={LeadPageText.FIELD_EMAIL_PLACEHOLDER} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="phone_number"
              label={LeadPageText.FIELD_PHONE_NUMBER_LABEL}
            >
              <Input placeholder={LeadPageText.FIELD_PHONE_NUMBER_PLACEHOLDER} />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="date_of_birth"
              label={LeadPageText.FIELD_DATE_OF_BIRTH_LABEL}
            >
              <Select placeholder="Chọn năm" allowClear showSearch>
                {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <Select.Option key={year} value={year.toString()}>
                    {year}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="place_of_birth"
              label={LeadPageText.FIELD_PLACE_OF_BIRTH_LABEL}
            >
              <LocationSelect onlyProvince disabled={Boolean(isSubmitting)} />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="citizen_id"
              label={LeadPageText.FIELD_CITIZEN_ID_LABEL}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="ethnicity"
              label={LeadPageText.FIELD_ETHNICITY_LABEL}
            >
              <Select
                options={Ethnicity.map((ethnicity) => ({
                  label: ethnicity,
                  value: ethnicity,
                }))}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="place_of_origin"
              label={LeadPageText.FIELD_PLACE_OF_ORIGIN_LABEL}
            >
              <LocationSelect disabled={Boolean(isSubmitting)} />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="current_address"
              label={LeadPageText.FIELD_CURRENT_ADDRESS_LABEL}
            >
              <LocationSelect disabled={Boolean(isSubmitting)} />
            </Form.Item>
          </Col>


          <Col span={8}>
            <Form.Item
              name="source"
              label={LeadPageText.FIELD_SOURCE_LABEL}
            >
              <Select
                options={Object.values(LeadSource).map((source) => ({
                  label: LeadSourceLabel[source as keyof typeof LeadSourceLabel],
                  value: source,
                }))}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="status"
              label={LeadPageText.FIELD_STATUS_LABEL}
            >
              <Select
                options={Object.values(LeadStatus).map((status) => ({
                  label: LeadStatusLabel[status as keyof typeof LeadStatusLabel],
                  value: status,
                }))}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="course_ids"
              label={LeadPageText.FIELD_COURSE_IDS_LABEL}
            >
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

          <Col span={24}>
            <Form.Item
              name="note"
              label={LeadPageText.FIELD_NOTE_LABEL}
            >
              <Input.TextArea rows={4} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
