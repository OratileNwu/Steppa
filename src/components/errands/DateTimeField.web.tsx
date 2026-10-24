import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, commonStyles, spacing, typography } from "@/theme";

type Props = {
  label: string;
  mode: "date" | "time";
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(number: number) {
  return String(number).padStart(2, "0");
}

function formatDate(date: Date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
}

function readDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return new Date();

  const result = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  return Number.isNaN(result.getTime()) ? new Date() : result;
}

export default function DateTimeField({
  label,
  mode,
  value,
  onChange,
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [hour, setHour] = useState("09");
  const [minute, setMinute] = useState("00");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const days = Array.from({ length: cellCount }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const weeks = Array.from({ length: cellCount / 7 }, (_, index) =>
    days.slice(index * 7, index * 7 + 7),
  );

  const canGoBack =
    year > today.getFullYear() ||
    (year === today.getFullYear() && month > today.getMonth());

  function openPicker() {
    if (mode === "date") {
      const selected = readDate(value);
      const initial = selected < today ? today : selected;

      setVisibleMonth(new Date(initial.getFullYear(), initial.getMonth(), 1));
    } else {
      const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

      setHour(match ? match[1] : "09");
      setMinute(match ? match[2] : "00");
    }

    setOpen(true);
  }

  function changeMonth(amount: number) {
    setVisibleMonth(new Date(year, month + amount, 1));
  }

  return (
    <View style={commonStyles.section}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
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

        <Text style={styles.actionText}>
          {mode === "date" ? "Calendar" : "Choose time"}
        </Text>
      </Pressable>

      {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog} accessibilityViewIsModal>
            <Text style={styles.title}>{label}</Text>

            {mode === "date" ? (
              <>
                <View style={styles.monthHeader}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Previous month"
                    accessibilityState={{ disabled: !canGoBack }}
                    disabled={!canGoBack}
                    onPress={() => changeMonth(-1)}
                    style={[
                      styles.navigationButton,
                      !canGoBack && styles.disabled,
                    ]}
                  >
                    <Text style={styles.navigationText}>‹</Text>
                  </Pressable>

                  <Text style={styles.monthTitle}>
                    {visibleMonth.toLocaleDateString("en-ZA", {
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Next month"
                    onPress={() => changeMonth(1)}
                    style={styles.navigationButton}
                  >
                    <Text style={styles.navigationText}>›</Text>
                  </Pressable>
                </View>

                <View style={styles.calendarRow}>
                  {weekdays.map((day) => (
                    <View key={day} style={styles.cell}>
                      <Text style={styles.weekday}>{day}</Text>
                    </View>
                  ))}
                </View>

                {weeks.map((week, weekIndex) => (
                  <View key={weekIndex} style={styles.calendarRow}>
                    {week.map((day, dayIndex) => {
                      if (day === null) {
                        return <View key={dayIndex} style={styles.cell} />;
                      }

                      const candidate = new Date(year, month, day);
                      const formatted = formatDate(candidate);
                      const isPast = candidate < today;
                      const selected = formatted === value;
                      const isToday = formatted === formatDate(today);

                      return (
                        <View key={dayIndex} style={styles.cell}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={candidate.toLocaleDateString(
                              "en-ZA",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                            accessibilityState={{
                              selected,
                              disabled: isPast,
                            }}
                            disabled={isPast}
                            onPress={() => {
                              onChange(formatted);
                              setOpen(false);
                            }}
                            style={[
                              styles.dayButton,
                              isToday && styles.today,
                              selected && styles.selectedDay,
                              isPast && styles.disabled,
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayText,
                                selected && styles.selectedDayText,
                              ]}
                            >
                              {day}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </>
            ) : (
              <>
                <View style={styles.timeRow}>
                  <View style={styles.timeColumn}>
                    <Text style={styles.label}>Hour</Text>

                    <select
                      aria-label="Hour"
                      value={hour}
                      onChange={(event) => setHour(event.currentTarget.value)}
                      style={{
                        width: "100%",
                        padding: 12,
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.surface,
                        color: colors.text,
                        fontSize: 18,
                      }}
                    >
                      {Array.from({ length: 24 }, (_, index) => (
                        <option key={index} value={pad(index)}>
                          {pad(index)}
                        </option>
                      ))}
                    </select>
                  </View>

                  <Text style={styles.colon}>:</Text>

                  <View style={styles.timeColumn}>
                    <Text style={styles.label}>Minute</Text>

                    <select
                      aria-label="Minute"
                      value={minute}
                      onChange={(event) => setMinute(event.currentTarget.value)}
                      style={{
                        width: "100%",
                        padding: 12,
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.surface,
                        color: colors.text,
                        fontSize: 18,
                      }}
                    >
                      {Array.from({ length: 60 }, (_, index) => (
                        <option key={index} value={pad(index)}>
                          {pad(index)}
                        </option>
                      ))}
                    </select>
                  </View>
                </View>

                <Text style={styles.timeHint}>
                  Use 24-hour time. For example, 14:30 means 2:30 PM.
                </Text>

                <Pressable
                  accessibilityRole="button"
                  style={commonStyles.primaryButton}
                  onPress={() => {
                    onChange(`${hour}:${minute}`);
                    setOpen(false);
                  }}
                >
                  <Text style={commonStyles.primaryButtonText}>
                    Confirm time
                  </Text>
                </Pressable>
              </>
            )}

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
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  value: {
    color: colors.text,
    fontSize: typography.small,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  actionText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "600",
  },
  invalidInput: {
    borderColor: colors.error,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dialog: {
    width: "100%",
    maxWidth: 400,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  navigationButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  navigationText: {
    color: colors.primary,
    fontSize: 28,
  },
  calendarRow: {
    flexDirection: "row",
  },
  cell: {
    width: "14.285714%",
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  weekday: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  dayText: {
    color: colors.text,
    fontSize: 14,
  },
  today: {
    borderColor: colors.primary,
  },
  selectedDay: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedDayText: {
    color: colors.surface,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.3,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeColumn: {
    flex: 1,
    gap: 8,
  },
  colon: {
    color: colors.text,
    fontSize: 24,
    marginTop: 24,
  },
  timeHint: {
    color: colors.textSecondary,
    fontSize: typography.small,
  },
});
