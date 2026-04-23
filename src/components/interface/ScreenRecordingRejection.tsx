import {
  Modal, Text, Title, Stack,
} from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useStudyId } from '../../routes/utils';

const AR_LABELS = {
  title: 'تم إيقاف تسجيل الشاشة',
  message: 'شكراً لمشاركتك في هذه الدراسة. تم إيقاف تسجيل الشاشة.لا يمكنك المتابعة.',
  closeMessage: 'يمكنك إغلاق هذه الصفحة الآن.',
};

const EN_LABELS = {
  title: 'Screen Recording Stopped',
  message: 'Thank you for participating in this study. Screen recording was stopped and you will not be able to continue.',
  closeMessage: 'You may now close this page.',
};

export function ScreenRecordingRejection() {
  const studyId = useStudyId();
  const isArabic = studyId === 'rtl-exp-ar';
  const labels = isArabic ? AR_LABELS : EN_LABELS;

  return (
    <Modal opened onClose={() => {}} fullScreen withCloseButton={false} dir={isArabic ? 'rtl' : 'ltr'}>
      <Stack align="center" justify="center">
        <IconAlertTriangle size={64} color="orange" />
        <Title order={3}>{labels.title}</Title>
        <Text size="md" ta="center">
          <>
            {labels.message}
            <br />
            {labels.closeMessage}
          </>
        </Text>
      </Stack>
    </Modal>
  );
}
