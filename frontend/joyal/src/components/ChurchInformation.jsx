
import { useState } from "react";
import "./ChurchInformation.css";

function ChurchInformation() {
    const [expanded, setExpanded] = useState(false);

    return (
        <section className="church-info" id="about-csi">
            <div className="church-info-container">

                <div className="church-info-heading">
                    <span className="church-info-label">
                        OUR HERITAGE · OUR FAITH
                    </span>

                    <h2>
                        About the Church of South India
                    </h2>

                    <p className="church-info-subtitle">
                        United in Christ, rooted in faith,
                        and called to serve.
                    </p>
                </div>

                {/* Introduction visible by default */}
                <div className="church-info-intro">
                    <p>
                        The Church of South India (CSI) is a united
                        Protestant church formed on 27 September 1947.
                        It brought together churches from different
                        Christian traditions in a historic effort
                        to express unity in the body of Christ.
                    </p>

                    <p>
                        The motto of CSI is
                        <strong> "That they all may be one," </strong>
                        inspired by the prayer of Jesus in
                        John 17:21. This motto expresses the
                        importance of Christian unity, fellowship,
                        and a shared mission.
                    </p>
                </div>

                {/* Detailed article */}
                {expanded && (
                    <div className="church-info-details">

                        <article className="church-info-article">
                            <h3>1. History and Origins</h3>

                            <p>
                                The history of the Church of South India
                                reflects a long journey of prayer,
                                discussion, cooperation, and a shared
                                desire for Christian unity. Before CSI
                                was formed, Protestant congregations
                                in South India belonged to different
                                church traditions and organizations.
                            </p>

                            <p>
                                These traditions developed through
                                different historical movements and
                                missionary activities. Although they
                                shared faith in Jesus Christ and the
                                message of the Bible, they had different
                                forms of church government and worship.
                                Over time, Christian leaders began
                                exploring ways to bring these traditions
                                together in one united church.
                            </p>
                        </article>

                        <article className="church-info-article">
                            <h3>2. The Formation of CSI</h3>

                            <p>
                                The Church of South India was inaugurated
                                on 27 September 1947 at St. George's
                                Cathedral in Madras, now Chennai.
                                Its formation came shortly after
                                India's independence.
                            </p>

                            <p>
                                The union brought together the southern
                                Anglican dioceses, the South India
                                United Church, and the Methodist Church
                                of South India. The South India United
                                Church itself represented a union of
                                several Protestant traditions.
                            </p>

                            <p>
                                The formation of CSI became an important
                                event in the history of the worldwide
                                Christian ecumenical movement. It showed
                                that churches with different traditions
                                could work toward unity while respecting
                                their historical backgrounds.
                            </p>
                        </article>

                        <article className="church-info-article">
                            <h3>3. Christian Traditions</h3>

                            <p>
                                Four major traditions are especially
                                important to understanding the formation
                                of CSI:
                            </p>

                            <ul>
                                <li>
                                    <strong>Anglican:</strong> Known for
                                    its episcopal leadership and
                                    historic liturgical tradition.
                                </li>
                                <li>
                                    <strong>Methodist:</strong> Known for
                                    its emphasis on Christian growth,
                                    discipleship, and practical service.
                                </li>
                                <li>
                                    <strong>Presbyterian:</strong> Known
                                    for its tradition of church leadership
                                    through elders and councils.
                                </li>
                                <li>
                                    <strong>Congregational:</strong> Known
                                    for the important role of local
                                    congregations in church life.
                                </li>
                            </ul>

                            <p>
                                These traditions contributed to the
                                identity of CSI. Their union represented
                                a commitment to fellowship and a common
                                Christian witness beyond denominational
                                divisions.
                            </p>
                        </article>

                        <article className="church-info-article">
                            <h3>4. Our Motto: That They All May Be One</h3>

                            <blockquote className="church-info-verse">
                                <p>
                                    "That they all may be one."
                                </p>
                                <cite>John 17:21</cite>
                            </blockquote>

                            <p>
                                This motto comes from the prayer of
                                Jesus Christ for the unity of His
                                followers. It expresses the vision
                                behind the formation of CSI: Christians
                                from different backgrounds can come
                                together in faith, worship, fellowship,
                                and service.
                            </p>

                            <p>
                                Unity does not mean that every tradition
                                must have the same history. Instead,
                                it reminds Christians to seek peace,
                                respect one another, and work together
                                in the love of Christ.
                            </p>
                        </article>

                        <article className="church-info-article">
                            <h3>5. Faith and Worship</h3>

                            <p>
                                The Church of South India is rooted in
                                the Christian faith and the teachings
                                of the Bible. Its worship focuses on
                                prayer, Scripture readings, preaching,
                                hymns, fellowship, and the sacraments
                                of Baptism and Holy Communion.
                            </p>

                            <p>
                                CSI services take place in the languages
                                of the communities they serve. This
                                helps people worship and hear the message
                                of Christ in languages they understand.
                                Worship practices also reflect the
                                church's different historical traditions.
                            </p>
                        </article>

                        <article className="church-info-article">
                            <h3>6. Leadership and Organization</h3>

                            <p>
                                CSI has an organized system of church
                                administration. The Synod provides
                                leadership at the wider church level,
                                while dioceses oversee church life
                                within their respective areas.
                                Bishops, clergy, councils, and lay
                                members have roles in leadership,
                                ministry, and administration.
                            </p>

                            <p>
                                Local congregations are important
                                places of worship, fellowship,
                                Christian learning, and community
                                participation. Through these
                                congregations, members take part
                                in the life and mission of the church.
                            </p>
                        </article>

                        <article className="church-info-article">
                            <h3>7. Service and Social Responsibility</h3>

                            <p>
                                Christian faith calls believers not
                                only to worship God but also to care
                                for others. CSI has a history of
                                educational, medical, community,
                                and social service through its
                                institutions and ministries.
                            </p>

                            <p>
                                Such service reflects the Christian
                                call to show compassion, help people
                                in need, support communities, and
                                promote peace and justice.
                                These responsibilities are important
                                expressions of faith in action.
                            </p>
                        </article>

                        <article className="church-info-article">
                            <h3>8. St. Stephen's C.S.I Church, Puthuval</h3>

                            <p>
                                This website represents St. Stephen's
                                C.S.I Church, Puthuval, and its youth
                                community. As a local church community,
                                it is a place through which members
                                can learn about Christian faith,
                                participate in fellowship, and
                                contribute to church activities.
                            </p>

                            <p>
                                The information above describes the
                                wider history and traditions of the
                                Church of South India. A separate
                                history of St. Stephen's C.S.I Church,
                                Puthuval, can be added when verified
                                details about its founding, development,
                                and important milestones are available.
                            </p>
                        </article>

                        <div className="church-info-conclusion">
                            <h3>A Shared Calling</h3>

                            <p>
                                The history of CSI reminds us that
                                Christian unity, faith, and service
                                remain important parts of the church's
                                mission. May our lives reflect the
                                love of Jesus Christ in our families,
                                churches, and communities.
                            </p>
                        </div>

                    </div>
                )}

                <button
                    type="button"
                    className="church-info-toggle"
                    onClick={() => setExpanded(!expanded)}
                    aria-expanded={expanded}
                >
                    {expanded ? "Read Less" : "Read More"}

                    <span aria-hidden="true">
                        {expanded ? " ↑" : " →"}
                    </span>
                </button>

            </div>
        </section>
    );
}

export default ChurchInformation;