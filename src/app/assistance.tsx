
import { useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/AppText';
import { AppCard } from '@/components/AppCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, spacing, radius } from '@/theme';

const SUPPORT_EMAIL = 'support@steppa.co.za';
const ADMIN_EMAIL = 'admin@steppa.co.za';
const SUPPORT_PHONE = '+27 69 337 0532';

export default function AssistanceScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
          >
            <AppText style={styles.backButtonText}>← Back</AppText>
          </Pressable>

          <AppText variant="heading">Assistance</AppText>
          <AppText variant="secondary">
            We are here to help you with STEPPA.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="heading">Contact Support</AppText>

          <AppCard padded>
            <ContactRow
              title="Support email"
              value={SUPPORT_EMAIL}
              buttonLabel="Email Support"
              onPress={() =>
                Linking.openURL(
                  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                    'STEPPA Support Enquiry',
                  )}`,
                )
              }
            />

            <View style={styles.separator} />

            <ContactRow
              title="Administrator email"
              value={ADMIN_EMAIL}
              buttonLabel="Email Admin"
              onPress={() =>
                Linking.openURL(
                  `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(
                    'STEPPA Assistance Request',
                  )}`,
                )
              }
            />

            <View style={styles.separator} />

            <ContactRow
              title="Support phone"
              value={SUPPORT_PHONE}
              buttonLabel="Call Support"
              onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
            />
          </AppCard>
        </View>

        <View style={styles.section}>
          <AppText variant="heading">Frequently Asked Questions</AppText>

          <AppCard padded>
            <HelpItem
              question="How do I get assistance?"
              answer="Use the enquiry form below or contact our support team using the contact details above."
            />

            <View style={styles.separator} />

            <HelpItem
              question="What should I include in my enquiry?"
              answer="Provide your name, email address, subject and a clear description of the problem you are experiencing."
            />

            <View style={styles.separator} />

            <HelpItem
              question="How do I contact the administrator?"
              answer={`You can contact the administrator directly at ${ADMIN_EMAIL}.`}
            />
          </AppCard>
        </View>

        <EnquiryForm />
      </ScrollView>
    </ScreenContainer>
  );
}

function EnquiryForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const clearForm = () => {
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  const showPopup = (
    title: string,
    text: string,
    success: boolean = false,
  ) => {
    setModalTitle(title);
    setModalMessage(text);
    setIsSuccess(success);
    setModalVisible(true);
  };

  const sendEnquiry = () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !subject.trim() ||
      !message.trim()
    ) {
      showPopup(
        'Missing information',
        'Please complete all four fields before sending your enquiry.',
      );
      return;
    }

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    if (!validEmail) {
      showPopup(
        'Invalid email address',
        'Please enter a valid email address, for example you@example.com.',
      );
      return;
    }

    showPopup(
      'Enquiry ready',
      'Thank you for contacting STEPPA. Your enquiry has been prepared successfully.',
      true,
    );
  };

  const closePopup = () => {
    setModalVisible(false);

    if (isSuccess) {
      clearForm();
    }
  };

  const cancelEnquiry = () => {
    clearForm();
    showPopup('Form cleared', 'All enquiry fields have been cleared.');
  };

  return (
    <View style={styles.section}>
      <AppText variant="heading">Send us an enquiry</AppText>

      <AppCard padded>
        <AppText variant="secondary">
          Have a question or need assistance? Complete the form below to
          prepare an enquiry for our support team.
        </AppText>

        <View style={styles.formField}>
          <AppText variant="body">Full name *</AppText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor="#888888"
            style={styles.input}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        <View style={styles.formField}>
          <AppText variant="body">Email address *</AppText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#888888"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.formField}>
          <AppText variant="body">Subject *</AppText>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="What do you need help with?"
            placeholderTextColor="#888888"
            style={styles.input}
            autoCorrect={false}
          />
        </View>

        <View style={styles.formField}>
          <AppText variant="body">Your message *</AppText>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your enquiry here..."
            placeholderTextColor="#888888"
            style={[styles.input, styles.messageInput]}
            multiline
            textAlignVertical="top"
            autoCorrect
          />
        </View>

        <View style={styles.formButtons}>
          <Pressable
            onPress={cancelEnquiry}
            style={[styles.formButton, styles.cancelButton]}
            accessibilityRole="button"
          >
            <AppText variant="body">Cancel</AppText>
          </Pressable>

          <Pressable
            onPress={sendEnquiry}
            style={[styles.formButton, styles.sendButton]}
            accessibilityRole="button"
          >
            <AppText style={styles.sendButtonText}>Send Enquiry</AppText>
          </Pressable>
        </View>

        <AppText variant="small">
          Fields marked with * are required. Never include passwords, PINs
          or full payment card details.
        </AppText>
      </AppCard>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closePopup}
      >
        <View style={popupStyles.overlay}>
          <View style={popupStyles.dialog}>
            <View
              style={[
                popupStyles.icon,
                isSuccess
                  ? popupStyles.successIcon
                  : popupStyles.errorIcon,
              ]}
            >
              <AppText
                style={[
                  popupStyles.iconText,
                  !isSuccess && popupStyles.errorIconText,
                ]}
              >
                {isSuccess ? '✓' : '!'}
              </AppText>
            </View>

            <AppText variant="heading">{modalTitle}</AppText>

            <AppText variant="secondary">
              {modalMessage}
            </AppText>

            <Pressable
              onPress={closePopup}
              style={popupStyles.button}
              accessibilityRole="button"
            >
              <AppText style={popupStyles.buttonText}>OK</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ContactRow({
  title,
  value,
  buttonLabel,
  onPress,
}: {
  title: string;
  value: string;
  buttonLabel: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.contactRow}>
      <View style={styles.contactDetails}>
        <AppText variant="body">{title}</AppText>
        <AppText variant="secondary">{value}</AppText>
      </View>

      <Pressable
        onPress={onPress}
        style={styles.contactButton}
        accessibilityRole="button"
      >
        <AppText style={styles.contactButtonText}>{buttonLabel}</AppText>
      </Pressable>
    </View>
  );
}

function HelpItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <View style={styles.helpItem}>
      <AppText variant="body">{question}</AppText>
      <AppText variant="secondary">{answer}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    gap: spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  contactDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  contactButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D9D9D9',
    marginVertical: spacing.md,
  },
  helpItem: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  formField: {
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    minHeight: 48,
  },
  messageInput: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
  formButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  formButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    backgroundColor: colors.primary,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F2F4F7',
    borderWidth: 1,
    borderColor: '#D0D5DD',
  },
});

const popupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    backgroundColor: '#E8F5EE',
  },
  errorIcon: {
    backgroundColor: '#FDECEC',
  },
  iconText: {
    fontSize: 26,
    color: '#176B45',
    fontWeight: '700',
  },
  errorIconText: {
    color: '#B42318',
  },
  button: {
    width: '100%',
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: '#176B45',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
