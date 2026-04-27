import {
  Box, Button, Title,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { useScreenRecordingContext } from '../../../../store/hooks/useScreenRecording';
import { StimulusParams } from '../../../../store/types';
import { RecordingAudioWaveform } from '../../../../components/interface/RecordingAudioWaveform';
import { useStudyId } from '../../../../routes/utils';

function ScreenRecordingPermission({ setAnswer }: StimulusParams<undefined>) {
  const studyId = useStudyId();
  const isArabicStudy = studyId === 'rtl-exp-ar';
  const {
    recordAudio,
    recordVideoRef,
    startScreenCapture: startCapture,
    stopScreenCapture: stopCapture,
    isScreenCapturing: screenCapturing,
    screenRecordingError: error,
    audioMediaStream,
  } = useScreenRecordingContext();

  // audioCapturingSuccess is set to true when we detect sound.
  const [audioCapturingSuccess, setAudioCapturingSuccess] = useState(false);

  useEffect(() => {
    setAnswer({
      status: screenCapturing && (recordAudio ? audioCapturingSuccess : true),
      provenanceGraph: undefined,
      answers: {
        screenRecordingPermission: screenCapturing,
      },
    });
  }, [screenCapturing, audioCapturingSuccess, setAnswer, recordAudio]);

  useEffect(() => {
    if (!screenCapturing) {
      return;
    }
    const stream = audioMediaStream.current;
    if (!stream) {
      return;
    }

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    const audioContext = new AudioContext();
    const audioStreamSource = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.minDecibels = -45;
    audioStreamSource.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const domainData = new Uint8Array(bufferLength);

    let soundDetected = false;

    const detectSound = () => {
      if (soundDetected) {
        return;
      }

      analyser.getByteFrequencyData(domainData);

      for (let i = 0; i < bufferLength; i += 1) {
        if (domainData[i] > 0) {
          soundDetected = true;
          setAudioCapturingSuccess(true);
        }
      }

      window.requestAnimationFrame(detectSound);
    };

    window.requestAnimationFrame(detectSound);
  }, [audioMediaStream, screenCapturing, setAnswer]);

  const titleText = isArabicStudy
    ? (recordAudio ? 'إذن تسجيل الشاشة والصوت' : 'إذن تسجيل الشاشة')
    : `Screen${recordAudio ? ' and Audio' : ''} Recording Permission`;

  const startRecordingText = isArabicStudy ? 'بدء التسجيل' : 'Start Recording';
  const stopRecordingText = isArabicStudy ? 'إيقاف التسجيل' : 'Stop Recording';
  const noteShareCorrectTabText = isArabicStudy
    ? 'ملاحظة: تأكد من اختيار تبويب المتصفح أو النافذة الصحيحة. إذا اخترت الخيار الخطأ، أوقف المشاركة ثم اختر الصحيح.'
    : 'Note: Please make sure you are recording the correct tab or window. Otherwise, stop and re-share the correct one.';
  const exitStudyText = isArabicStudy
    ? (recordAudio
      ? 'تتطلب هذه الدراسة تسجيل شاشتك وصوتك. إذا لم تكن مرتاحًا لذلك، يمكنك الخروج وإرجاع الدراسة.'
      : 'تتطلب هذه الدراسة تسجيل شاشتك. إذا لم تكن مرتاحًا لذلك، يمكنك الخروج وإرجاع الدراسة.')
    : (recordAudio
      ? 'This study requires recording of your screen and audio. If you\'re not comfortable, you may exit and return the study.'
      : 'This study requires recording of your screen. If you\'re not comfortable, you may exit and return the study.');

  return (
    <Box p="md" dir={isArabicStudy ? 'rtl' : 'ltr'} style={{ direction: isArabicStudy ? 'rtl' : 'ltr' }}>
      <Title order={1} size="h2">
        {titleText}
      </Title>

      {recordAudio ? (
        <>
          {/* Record both screen and audio */}
          <p>
            {exitStudyText}
          </p>
          <p>{isArabicStudy ? 'اتبع الخطوات التالية لمنح أذونات تسجيل الشاشة والصوت.' : 'Follow the steps below to grant screen and audio recording permissions.'}</p>

          <ol>
            <li>
              <strong>{isArabicStudy ? 'انقر على الزر أدناه' : 'Click the button below'}</strong>
              {' '}
              {isArabicStudy ? 'لتفعيل تسجيل الشاشة والصوت.' : 'to enable screen and audio recording.'}
              <Button type="button" onClick={screenCapturing ? stopCapture : startCapture} display="block" mt="sm">
                {screenCapturing ? stopRecordingText : startRecordingText}
              </Button>
              <video
                ref={recordVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '400px', border: '1px solid #ccc', marginTop: '1rem' }}
              />
              {error && <p style={{ color: 'red' }}>{error}</p>}
              <p><i>{noteShareCorrectTabText}</i></p>

            </li>
            <li>
              <strong>{isArabicStudy ? 'تحدّث' : 'Speak'}</strong>
              {' '}
              {isArabicStudy ? 'في الميكروفون للتأكد من أن الصوت يعمل.' : 'into your microphone to check if audio is working.'}
              {(recordAudio && screenCapturing) ? <Box h={200} w={400} bd="1px solid #ccc"><RecordingAudioWaveform height={200} width={400} /></Box> : <Box h={200} w={400} bd="1px solid #ccc" />}
            </li>
          </ol>
          <strong>Note:</strong>
          <ul>
            <li>
              {isArabicStudy
                ? 'بعد أن نكتشف صوتًا، سيتم تفعيل زر المتابعة.'
                : (
                  <>
                    After we hear you say something, the
                    {' '}
                    <b>Continue</b>
                    {' '}
                    button will be enabled.
                  </>
                )}
            </li>
            <li>{isArabicStudy ? 'يرجى عدم إغلاق النافذة أو إيقاف التسجيل حتى تنتهي الدراسة بالكامل.' : 'Please do not close the window or screen recording until the entire study is completed.'}</li>
          </ul>
        </>
      ) : (
        <>
          {/* Record screen only */}
          <p>
            {exitStudyText}
          </p>
          <strong>{isArabicStudy ? 'انقر على الزر أدناه' : 'Click the button below'}</strong>
          {' '}
          {isArabicStudy ? 'لتفعيل تسجيل الشاشة.' : 'to enable screen recording.'}
          <Button type="button" onClick={screenCapturing ? stopCapture : startCapture} display="block" mt="sm">
            {screenCapturing ? stopRecordingText : startRecordingText}
          </Button>
          <video
            ref={recordVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '400px', border: '1px solid #ccc', marginTop: '1rem' }}
          />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <p><i>{noteShareCorrectTabText}</i></p>

          <strong>{isArabicStudy ? 'ملاحظة:' : 'Note:'}</strong>
          <ul>
            <li>{isArabicStudy ? 'يرجى عدم إغلاق النافذة أو إيقاف التسجيل حتى تنتهي الدراسة بالكامل.' : 'Please do not close the window or screen recording until the entire study is completed.'}</li>
          </ul>
        </>
      )}
    </Box>
  );
}

export default ScreenRecordingPermission;
