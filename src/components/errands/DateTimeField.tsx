import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { colors, commonStyles, spacing, typography } from "@/theme";

type Props = {
  label: string;
  mode: "date" | "time";
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

function formatValue(date: Date, mode: Props["mode"]) {
  const pad = (number: number) => String(number).padStart(2, "0");

  if (mode === "time") {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
}

function getPickerValue(value: string, mode: Props["mode"]) {
  const result = new Date();

  if (mode === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    result.setFullYear(year, month - 1, day);
  }

  if (mode === "time" && /^\d{2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(":").map(Number);
    result.setHours(hours, minutes, 0, 0);
  }

  return result;
}

export default function DateTimeField({
  label,
  mode,
  value,
  onChange,
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(new Date());

  function openPicker() {
    setDraft(getPickerValue(value, mode));
    setOpen(true);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const picker = (
    <DateTimePicker
      value={draft}
      mode={mode}
      display={
        Platform.OS === "ios"
          ? mode === "date"
            ? "inline"
            : "spinner"
          : "default"
      }
      minimumDate={mode === "date" ? today : undefined}
      is24Hour
      onChange={(event, selectedDate) => {
        if (Platform.OS !== "ios") {
          setOpen(false);

          if (event.type === "set" && selectedDate) {
            onChange(formatValue(selectedDate, mode));
          }

          return;
        }

        if (selectedDate) {
          setDraft(selectedDate);
        }
      }}
    />
  );

  return (
    <View style={commonStyles.section}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={openPicker}
        style={[
          commonStyles.input,
          styles.field,
          error ? styles.invalidInput : undefined,
        ]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value || (mode === "date" ? "Select a date" : "Select a time")}
        </Text>

        <Text style={styles.hint}>{mode === "date" ? "Calendar" : "Time"}</Text>
      </Pressable>

      {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

      {open && Platform.OS !== "ios" ? picker : null}

      {Platform.OS === "ios" ? (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <View style={styles.overlay}>
            <View style={[commonStyles.card, styles.dialog]}>
              <Text style={styles.label}>{label}</Text>

              {open ? picker : null}

              <Pressable
                accessibilityRole="button"
                style={commonStyles.primaryButton}
                onPress={() => {
                  onChange(formatValue(draft, mode));
                  setOpen(false);
                }}
              >
                <Text style={commonStyles.primaryButtonText}>Done</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                style={commonStyles.secondaryButton}
                onPress={() => setOpen(false)}
              >
                <Text style={commonStyles.secondaryButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "600",
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  value: {
    color: colors.text,
    fontSize: typography.small,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: typography.small,
  },
  invalidInput: {
    borderColor: colors.error,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  dialog: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: colors.surface,
  },
});
