const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export default function ScheduleGrid({ groups }: { groups: any[] }) {
  return (
    <div className="gridStack">
      {groups.map((group) => (
        <section className="scheduleBand" key={group.id}>
          <h3>{group.name}</h3>
          <div className="weekGrid">
            {dayOrder.map((day) => (
              <div className="dayColumn" key={day}>
                <strong>{day}</strong>
                {(group.days?.[day] || []).map((item: any) => (
                  <div className="classBlock" key={item.id}>
                    <span>{item.start_time}-{item.end_time}</span>
                    <b>{item.course_name}</b>
                    <small>{item.teacher_name} / {item.section_name} / {item.room_code}</small>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
