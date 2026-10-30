# Proguard rules for CLIMB 1600 Android Companion
-keepattributes *Annotation*
-keepclassmembers class * {
    @androidx.room.* <methods>;
}
